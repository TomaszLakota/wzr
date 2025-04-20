import stripeClient from '../config/stripeConfig.js';

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
