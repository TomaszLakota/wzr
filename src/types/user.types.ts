export interface BackendUser {
  id: string;
  email: string;
  name: string | null;
  is_admin: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_plan: string | null;
  subscription_status: string;
  subscription_start_date: string | null;
  cancel_at: string | null;
}

export interface User {
  email: string;
  name: string | null;
  subscriptionPlan: string | null;
  subscriptionStatus: string;
  subscriptionStartDate: string | null;
  cancelAt: string | null;
  isAdmin: boolean;
  status: string;
  isSubscribed: boolean;
}
