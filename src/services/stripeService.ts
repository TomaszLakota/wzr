// Real service that fetches from the backend API

import {
  CheckoutSessionResponse,
  PaymentVerificationResponse,
  ApiVerificationData,
} from '../types/stripe.types';
import apiClient from './apiClient';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Create checkout session for a product
 * @param {string} priceId - ID of the price to checkout
 * @returns {Promise<CheckoutSessionResponse>} - Checkout session info
 */
export const createCheckoutSession = async (priceId: string): Promise<CheckoutSessionResponse> => {
  if (!priceId) {
    throw new Error('ID ceny jest wymagane');
  }

  // Generate success URL - ensure we have a complete URL with origin
  const baseUrl = window.location.origin;
  const successUrl = `${baseUrl}/platnosc/sukces`;
  const cancelUrl = `${baseUrl}/ebooki`;

  // Get auth token
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Musisz być zalogowany, aby dokonać zakupu');
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(`${API_BASE_URL}/ebooks/checkout`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      priceId,
      successUrl,
      cancelUrl,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})); // Try to parse error body
    throw new Error(errorData.message || `Błąd: ${response.status}`);
  }

  // Assume the response JSON has a 'url' field on success
  const data: { url?: string } = await response.json();

  return {
    success: true,
    message: 'Przekierowanie do płatności...',
    sessionUrl: data.url,
  };
};

/**
 * Verify payment status using payment intent ID or session ID
 * @param {string} id - ID of the payment intent or session to verify
 * @returns {Promise<PaymentVerificationResponse>} - Payment status information
 */
export const verifyPaymentStatus = async (id: string): Promise<PaymentVerificationResponse> => {
  if (!id) {
    throw new Error('ID płatności jest wymagane');
  }

  // Determine if this is a session ID or payment intent ID
  const isSessionId = id.startsWith('cs_');
  const endpoint = isSessionId
    ? `${API_BASE_URL}/checkout/sessions/${id}/verify`
    : `${API_BASE_URL}/payments/${id}/verify`;

  // Use the generic get method with the expected response type
  const data = await apiClient.get<ApiVerificationData>(endpoint);

  // If payment is successful, update localStorage
  console.log('data.status', data.status);
  if (data.status === 'success') {
    // Update local storage to reflect subscription
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      user.isSubscribed = true;
      localStorage.setItem('user', JSON.stringify(user));
      // Dispatch event to notify other components of auth change
      window.dispatchEvent(new Event('authChange'));
    }
  }

  return {
    status: data.status,
    amount: data.amount,
    currency: data.currency,
    success: data.status === 'success',
    message:
      data.status === 'success'
        ? 'Płatność zakończona sukcesem!'
        : 'Płatność jest w trakcie przetwarzania.',
  };
};

/**
 * Create checkout session for a subscription
 * @param {string} priceId - ID of the subscription price
 * @param {string} successUrl - URL to redirect to on successful payment
 * @param {string} cancelUrl - URL to redirect to on canceled payment
 * @returns {Promise<CheckoutSessionResponse>} - Checkout session info
 */
export const createSubscriptionCheckoutSession = async (
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<CheckoutSessionResponse> => {
  if (!priceId) {
    throw new Error('ID ceny jest wymagane');
  }
  if (!successUrl || !cancelUrl) {
    throw new Error('Adresy URL sukcesu i anulowania są wymagane');
  }

  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Musisz być zalogowany, aby subskrybować');
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(`${API_BASE_URL}/subscription/create-checkout-session`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      priceId,
      successUrl,
      cancelUrl,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})); // Try to parse error body
    throw new Error(errorData.message || `Błąd tworzenia sesji subskrypcji: ${response.status}`);
  }

  const data: { url?: string } = await response.json();

  if (!data.url) {
    throw new Error('Nie otrzymano adresu URL sesji płatności');
  }

  return {
    success: true,
    message: 'Przekierowanie do płatności...',
    sessionUrl: data.url,
  };
};
