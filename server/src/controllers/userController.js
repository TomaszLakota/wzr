import stripeClient from '../config/stripeConfig.js';

// Helper function to check and update subscription status
const checkAndUpdateSubscription = async (userRecord) => {
  console.log(`[USER-SUB-CHECK] Checking subscription for customer: ${userRecord.email}`);

  // Return early if no Stripe customer ID exists
  if (!userRecord.stripeCustomerId) {
    console.log(`[USER-SUB-CHECK] No Stripe customer ID for user: ${userRecord.email}`);
    return { ...userRecord, isSubscribed: false };
  }

  try {
    console.log(
      `[USER-SUB-CHECK] Fetching subscriptions for customer: ${userRecord.stripeCustomerId}`
    );
    const subscriptions = await stripeClient.subscriptions.list({
      customer: userRecord.stripeCustomerId,
      limit: 100,
    });

    console.log(`[USER-SUB-CHECK] Found ${subscriptions.data.length} subscriptions`);

    // Find active subscriptions
    const activeSubscriptions = subscriptions.data.filter(
      (sub) => sub.status === 'active' || sub.status === 'trialing'
    );

    console.log(`[USER-SUB-CHECK] Found ${activeSubscriptions.length} active subscriptions`);

    // Determine if user is subscribed
    const isSubscribed = activeSubscriptions.length > 0;
    const previousStatus = userRecord.isSubscribed || false;
    const currentSubId = userRecord.stripeSubscriptionId || '';
    const newSubId =
      isSubscribed && activeSubscriptions.length > 0 ? activeSubscriptions[0].id : '';

    // Only update user record if status or subscription ID changed
    if (isSubscribed !== previousStatus || (isSubscribed && newSubId !== currentSubId)) {
      // Create new object with updated values rather than modifying the original
      const updatedUserRecord = {
        ...userRecord,
        isSubscribed: isSubscribed,
      };

      if (isSubscribed && activeSubscriptions.length > 0) {
        updatedUserRecord.stripeSubscriptionId = activeSubscriptions[0].id;
        console.log(`[USER-SUB-CHECK] Setting subscription ID to: ${activeSubscriptions[0].id}`);
      }

      console.log(
        `[USER-SUB-CHECK] Updated subscription status from ${previousStatus} to ${isSubscribed}`
      );

      return updatedUserRecord;
    }

    // Return original record if nothing changed
    return userRecord;
  } catch (error) {
    console.error(`[USER-SUB-CHECK] Error checking subscription: ${error.message}`);
    // Return original record if there's an error
    return userRecord;
  }
};

// Get user by email
export const getUserByEmail = async (req, res) => {
  try {
    const { users } = global.stores;
    // Only allow users to access their own data
    if (req.user.email !== req.params.email) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await users.get(req.params.email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check and update subscription status from Stripe
    const updatedUser = await checkAndUpdateSubscription(user);

    // Save updated user record if changed
    if (JSON.stringify(user) !== JSON.stringify(updatedUser)) {
      await users.set(req.params.email, updatedUser);
      console.log(`[GET-USER] Updated user record with latest subscription status`);
    }

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user subscription status
export const updateSubscriptionStatus = async (req, res) => {
  try {
    const { users } = global.stores;
    const user = req.user;
    console.log(`[UPDATE-SUB] Manually updating subscription status for user: ${user.email}`);

    // Get user record
    const userRecord = await users.get(user.email);
    if (!userRecord) {
      console.log(`[UPDATE-SUB] User not found: ${user.email}`);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`[UPDATE-SUB] Current user record: ${JSON.stringify(userRecord)}`);

    // Check if user has Stripe customer ID
    if (!userRecord.stripeCustomerId) {
      console.log(`[UPDATE-SUB] User has no Stripe customer ID`);
      return res.json({
        success: false,
        message: 'No Stripe customer found',
        isSubscribed: false,
      });
    }

    // Check for active subscription
    try {
      console.log(
        `[UPDATE-SUB] Fetching subscription for customer: ${userRecord.stripeCustomerId}`
      );
      const subscription = await stripeClient.subscriptions.list({
        customer: userRecord.stripeCustomerId,
        limit: 100,
      });

      console.log(`[UPDATE-SUB] Found ${subscription.data.length} subscription`);

      // Find active subscription
      const activeSubscriptions = subscription.data.filter(
        (sub) => sub.status === 'active' || sub.status === 'trialing'
      );

      console.log(`[UPDATE-SUB] Found ${activeSubscriptions.length} active subscription`);

      const isSubscribed = activeSubscriptions.length > 0;
      const previousStatus = userRecord.isSubscribed || false;

      // Update subscription status
      userRecord.isSubscribed = isSubscribed;

      if (isSubscribed && activeSubscriptions.length > 0) {
        userRecord.stripeSubscriptionId = activeSubscriptions[0].id;
        console.log(`[UPDATE-SUB] Setting subscription ID to: ${activeSubscriptions[0].id}`);
      }

      // Save updated user
      await users.set(user.email, userRecord);
      console.log(
        `[UPDATE-SUB] Updated user subscription status from ${previousStatus} to ${isSubscribed}`
      );

      // Verify update
      const updatedUser = await users.get(user.email);
      console.log(`[UPDATE-SUB] User record after update: ${JSON.stringify(updatedUser)}`);

      return res.json({
        success: true,
        message: 'Subscription status updated',
        isSubscribed,
        previousStatus,
        subscriptionDetails:
          isSubscribed && activeSubscriptions.length > 0
            ? {
                id: activeSubscriptions[0].id,
                status: activeSubscriptions[0].status,
                currentPeriodEnd: new Date(
                  activeSubscriptions[0].current_period_end * 1000
                ).toISOString(),
              }
            : null,
      });
    } catch (error) {
      console.error(`[UPDATE-SUB] Error checking subscription status: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: 'Error checking subscription status',
      });
    }
  } catch (error) {
    console.error(`[UPDATE-SUB] Error updating subscription status: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
