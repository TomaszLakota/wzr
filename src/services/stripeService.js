// Real service that fetches from the backend API

// API base URL - adjust according to your environment
const API_BASE_URL = import.meta.env.API_URL || 'http://localhost:3000/api';

/**
 * Get products from the backend
 * @returns {Promise<Array>} - Array of products with prices
 */
export const getProducts = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/ebooks`);

    if (!response.ok) {
      throw new Error(`Błąd: ${response.status}`);
    }

    const products = await response.json();
    return products;
  } catch (error) {
    console.error('Błąd podczas pobierania produktów:', error);
    throw error;
  }
};

/**
 * Create checkout session for a product
 * @param {string} priceId - ID of the price to checkout
 * @returns {Promise<Object>} - Checkout session info
 */
export const createCheckoutSession = async (priceId) => {
  try {
    if (!priceId) {
      throw new Error('ID ceny jest wymagane');
    }

    // Generate success URL - ensure we have a complete URL with origin
    const baseUrl = window.location.origin;
    const successUrl = `${baseUrl}/platnosc/sukces`;
    const cancelUrl = `${baseUrl}/ebooki`;

    // Get auth token from local storage or context
    const token = localStorage.getItem('authToken');

    const response = await fetch(`${API_BASE_URL}/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
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
  } catch (error) {
    console.error('Błąd podczas tworzenia sesji płatności:', error);
    throw error;
  }
};

/**
 * Verify payment status using payment intent ID or session ID
 * @param {string} id - ID of the payment intent or session to verify
 * @returns {Promise<Object>} - Payment status information
 */
export const verifyPaymentStatus = async (id) => {
  try {
    if (!id) {
      throw new Error('ID płatności jest wymagane');
    }

    // Get auth token from local storage or context
    const token = localStorage.getItem('authToken');

    // Determine if this is a session ID or payment intent ID
    const isSessionId = id.startsWith('cs_');
    const endpoint = isSessionId
      ? `${API_BASE_URL}/checkout/sessions/${id}/verify`
      : `${API_BASE_URL}/payments/${id}/verify`;

    const response = await fetch(endpoint, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      throw new Error(`Błąd: ${response.status}`);
    }

    const data = await response.json();

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
  } catch (error) {
    console.error('Błąd podczas weryfikacji statusu płatności:', error);
    throw error;
  }
};

/**
 * Get user's purchased ebooks
 * @returns {Promise<Array>} - Array of purchased ebooks
 */
export const getPurchasedEbooks = async () => {
  try {
    // Get auth token from local storage or context
    const token = localStorage.getItem('authToken');

    if (!token) {
      throw new Error('Użytkownik nie jest zalogowany');
    }

    const response = await fetch(`${API_BASE_URL}/user/ebooks`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Błąd: ${response.status}`);
    }

    const purchases = await response.json();
    return purchases;
  } catch (error) {
    console.error('Błąd podczas pobierania zakupionych ebooków:', error);
    throw error;
  }
};
