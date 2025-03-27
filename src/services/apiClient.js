// API client with interceptors for handling common response scenarios
const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));

  // Handle 403 error specifically
  if (response.status === 403 && data.error === 'Token jest nieprawidłowy lub wygasł') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('authChange'));
    window.location.href = '/logowanie';

    throw new Error(data.error);
  }

  // For other error responses, throw the error
  if (!response.ok) {
    throw new Error(data.error || response.statusText);
  }

  return data;
};

export const apiClient = {
  fetch: async (url, options = {}) => {
    // Get the token if it exists
    const token = localStorage.getItem('token');

    // Add authorization header if token exists
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    // Make the request
    const response = await fetch(url, {
      ...options,
      headers,
      cache: 'no-store',
    });

    return handleResponse(response);
  },

  get: (url, options = {}) => {
    return apiClient.fetch(url, {
      ...options,
      method: 'GET',
    });
  },

  post: (url, data, options = {}) => {
    return apiClient.fetch(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  put: (url, data, options = {}) => {
    return apiClient.fetch(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: (url, options = {}) => {
    return apiClient.fetch(url, {
      ...options,
      method: 'DELETE',
    });
  },
};

export default apiClient;
