import stripeClient from '../config/stripe.js';

const syncSubscriptionStatus = async (supabase, userId) => {
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select(
      'id, email, name, stripe_customer_id, stripe_subscription_id, is_admin, subscription_status'
    )
    .eq('id', userId)
    .single();

  if (fetchError || !user) {
    console.error('[SUB-SYNC] Error fetching user or user not found:', fetchError);
    return null;
  }

  if (!user.stripe_customer_id) {
    if (user.subscription_status !== 'inactive') {
      const { error: updateError } = await supabase
        .from('users')
        .update({ subscription_status: 'inactive' })
        .eq('id', userId);
      if (updateError) {
        console.error('[SUB-SYNC] Error updating status to inactive:', updateError);
      } else {
        user.subscription_status = 'inactive';
      }
    }
    return user;
  }

  let isStripeSubscribed = false;
  try {
    const subscriptions = await stripeClient.subscriptions.list({
      customer: user.stripe_customer_id,
      limit: 1,
      status: 'active',
    });
    isStripeSubscribed = subscriptions.data.length > 0;
  } catch (stripeError) {
    console.error(`[SUB-SYNC] Error fetching Stripe subscriptions: ${stripeError.message}`);

    return user;
  }

  const currentDbStatus = user.subscription_status === 'active';
  const newDbStatus = isStripeSubscribed ? 'active' : 'inactive';

  if (currentDbStatus !== isStripeSubscribed) {
    const { error: updateError } = await supabase
      .from('users')
      .update({ subscription_status: newDbStatus })
      .eq('id', userId);

    if (updateError) {
      console.error('[SUB-SYNC] Error updating subscription status in DB:', updateError);

      return user;
    } else {
      user.subscription_status = newDbStatus;
    }
  }

  return user;
};

// Get user by email (Primarily for owner to get their own details)
export const getUserByEmail = async (req, res) => {
  const supabase = req.app.locals.supabase;
  const requestedEmail = req.params.email;
  const authenticatedUserId = req.user.userId;

  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', requestedEmail)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user by email:', fetchError);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.id !== authenticatedUserId) {
      console.warn(
        `[GET-USER] Forbidden attempt: User ${authenticatedUserId} tried to access ${requestedEmail} (ID: ${user.id})`
      );
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedUser = await syncSubscriptionStatus(supabase, authenticatedUserId);

    if (!updatedUser) {
      console.error(`[GET-USER] Failed to sync/retrieve user data for ID: ${authenticatedUserId}`);
      return res.status(500).json({ error: 'Failed to retrieve user data' });
    }

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error in getUserByEmail controller:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Force update user subscription status based on Stripe
export const updateSubscriptionStatus = async (req, res) => {
  const supabase = req.app.locals.supabase;
  const authenticatedUserId = req.user.userId;

  try {
    const updatedUser = await syncSubscriptionStatus(supabase, authenticatedUserId);

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, error: 'User not found or failed to sync status' });
    }

    res.json({
      success: true,
      message: 'Subscription status synchronized with Stripe',
      isSubscribed: updatedUser.subscription_status === 'active',
    });
  } catch (error) {
    console.error(
      `[UPDATE-SUB] Error forcing subscription update for user ID ${authenticatedUserId}:`,
      error
    );
    res.status(500).json({
      success: false,
      error: 'Internal server error during subscription update',
    });
  }
};

// Admin: Get all users with active subscriptions
export const getAllSubscribedUsersAdmin = async (req, res) => {
  const supabase = req.app.locals.supabase;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    // 1. Fetch paginated subscribed users and total count from Supabase
    const {
      data: subscribedUsers,
      error: fetchError,
      count,
    } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .eq('subscription_status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (fetchError) {
      console.error('Error fetching subscribed users:', fetchError);
      return res.status(500).json({ error: 'Błąd podczas pobierania użytkowników' });
    }

    const totalSubscribedUsers = count || 0;

    // 2. Batch fetch subscription details from Stripe for the paginated users
    const productIds = new Set();
    const subscriptionsByCustomer = new Map();

    const subscriptionsPromises = subscribedUsers
      .filter((user) => user.stripe_customer_id) // Only fetch for users with a customer ID
      .map(
        (user) =>
          stripeClient.subscriptions
            .list({
              customer: user.stripe_customer_id,
              limit: 1,
              status: 'active', // Double-check with active status
              expand: ['data.items.data.price'],
            })
            .catch((e) => ({ error: e, data: [], customerId: user.stripe_customer_id })) // Catch errors per user
      );

    const subscriptionsResults = await Promise.all(subscriptionsPromises);

    // 3. Collect product IDs and map subscriptions to customers
    subscriptionsResults.forEach((result) => {
      if (!result.error && result.data?.[0]) {
        const subscription = result.data[0];
        const customerId = subscription.customer;
        const productId = subscription?.items?.data[0]?.price?.product;

        if (customerId) {
          subscriptionsByCustomer.set(customerId, subscription);
          if (productId) {
            productIds.add(productId);
          }
        }
      } else if (result.error) {
        console.error(
          `Error fetching subscription for customer ${result.customerId}:`,
          result.error.message
        );
        // Map error state or default subscription object if needed
        if (result.customerId)
          subscriptionsByCustomer.set(result.customerId, { error: 'Failed to fetch' });
      }
    });

    // 4. Batch fetch product details from Stripe
    const productsMap = new Map();
    if (productIds.size > 0) {
      try {
        const products = await stripeClient.products.list({
          ids: Array.from(productIds),
          limit: Math.min(productIds.size, 100), // Stripe limit is 100
        });
        products.data.forEach((product) => {
          productsMap.set(product.id, product);
        });
      } catch (productError) {
        console.error('Error fetching product details from Stripe:', productError);
        // Handle error - perhaps return plans as 'Error fetching'
      }
    }

    // 5. Combine user data with subscription and product details
    const usersWithDetails = subscribedUsers.map((user) => {
      const { password, ...userWithoutPassword } = user; // Ensure password is not selected or remove it
      const subscription = subscriptionsByCustomer.get(user.stripe_customer_id);

      if (!subscription || subscription.error) {
        return {
          ...userWithoutPassword,
          subscription_start_date: null,
          subscription_status: subscription?.error || 'unknown',
          subscription_plan: subscription?.error ? 'Error fetching plan' : 'Unknown',
          cancel_at: null,
        };
      }

      const productId = subscription?.items?.data[0]?.price?.product;
      const product = productsMap.get(productId);

      return {
        ...userWithoutPassword,
        subscription_start_date: new Date(subscription.start_date * 1000),
        subscription_status: subscription.status,
        subscription_plan: product?.name || 'Unknown Plan',
        cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
      };
    });

    res.json({
      users: usersWithDetails,
      pagination: {
        total: totalSubscribedUsers,
        page,
        limit,
        totalPages: Math.ceil(totalSubscribedUsers / limit),
      },
    });
  } catch (error) {
    console.error('Error processing /admin/users/subscriptions:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

// Admin: Create customer portal session
export const createCustomerPortalSessionAdmin = async (req, res) => {
  const supabase = req.app.locals.supabase;
  const userEmail = req.params.email;

  try {
    // Fetch user by email to get their Stripe Customer ID
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('email', userEmail)
      .single();

    if (fetchError || !user) {
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error(`Error fetching user ${userEmail} for portal:`, fetchError);
        return res.status(500).json({ error: 'Błąd podczas pobierania użytkownika' });
      }
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    if (!user.stripe_customer_id) {
      return res.status(404).json({ error: 'Użytkownik nie posiada ID klienta Stripe' });
    }

    // Create Stripe Billing Portal Session
    const session = await stripeClient.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/admin/users`, // More specific return URL?
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error(`Error creating portal session for ${userEmail}:`, error);
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ error: `Błąd Stripe: ${error.message}` });
    }
    res.status(500).json({ error: 'Błąd serwera podczas tworzenia sesji portalu' });
  }
};
