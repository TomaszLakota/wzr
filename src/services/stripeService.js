// Real service that fetches from the backend API

import apiClient from './apiClient';

// API base URL - adjust according to your environment
const API_BASE_URL = import.meta.env.API_URL || 'http://localhost:3000/api';

/**
 * Create checkout session for a product
 * @param {string} priceId - ID of the price to checkout
 * @returns {Promise<Object>} - Checkout session info
 */
export const createCheckoutSession = async (priceId) => {
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

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(`${API_BASE_URL}/checkout`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      priceId,
      successUrl,
      cancelUrl,
    }),
  });

  if (!response.ok) {
    throw new Error(`Błąd: ${response.status}`);
  }

  const data = await response.json();

  return {
    success: true,
    message: 'Przekierowanie do płatności...',
    sessionUrl: data.url,
  };
};

/**
 * Verify payment status using payment intent ID or session ID
 * @param {string} id - ID of the payment intent or session to verify
 * @returns {Promise<Object>} - Payment status information
 */
export const verifyPaymentStatus = async (id) => {
  if (!id) {
    throw new Error('ID płatności jest wymagane');
  }

  // Determine if this is a session ID or payment intent ID
  const isSessionId = id.startsWith('cs_');
  const endpoint = isSessionId
    ? `${API_BASE_URL}/checkout/sessions/${id}/verify`
    : `${API_BASE_URL}/payments/${id}/verify`;

  const data = await apiClient.get(endpoint);

  // If payment is successful, update localStorage
  if (data.status === 'succeeded') {
    // Update local storage to reflect subscription
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      user.isSubscribed = true;
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  return {
    status: data.status,
    amount: data.amount,
    currency: data.currency,
    success: data.status === 'succeeded',
    message:
      data.status === 'succeeded'
        ? 'Płatność zakończona sukcesem!'
        : 'Płatność jest w trakcie przetwarzania.',
  };
};
