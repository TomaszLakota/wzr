export interface Price {
  id: string;
  currency: string;
  unit_amount: number;
  formatted: string;
}

export interface PurchaseInfo {
  purchaseDate: string;
  downloadUrl?: string;
  paymentId: string;
}

export interface Purchase {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  images?: string[];
  price: Price;
  purchaseInfo: PurchaseInfo;
}

export interface CheckoutSessionResponse {
  success: boolean;
  message: string;
  sessionUrl?: string;
  error?: string;
}

export interface PaymentVerificationResponse {
  status: PaymentStatus;
  amount?: number;
  currency?: string;
  success: boolean;
  message: string;
}

export interface ApiVerificationData {
  status: PaymentStatus;
  amount?: number;
  currency?: string;
}

export type PaymentStatus = 'processing' | 'success' | 'error' | 'info';

export interface SubscriptionCreationResponse {
  clientSecret: string;
  success: boolean;
  message?: string; // Optional message
}
