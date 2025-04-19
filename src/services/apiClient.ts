// API client with interceptors for handling common response scenarios
const handleResponse = async <T = any>(response: Response): Promise<T> => {
  let data: any = {}; // Initialize data to avoid potential errors if json() fails
  try {
    data = await response.json();
  } catch (error) {
    // Handle cases where response has no body or is not valid JSON
    console.warn('Could not parse JSON response:', error);
  }

  // Handle 403 error specifically
  if (response.status === 403 && data.error === 'Token jest nieprawidłowy lub wygasł') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('authChange'));
    window.location.href = '/logowanie';

    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }

  // For other error responses, throw the error
  if (!response.ok) {
    throw new Error(data.error || response.statusText);
  }

  return data as T;
};

export const apiClient = {
  fetch: async <T = any>(url: string, options: RequestInit = {}): Promise<T> => {
    // Get the token if it exists
    const token = localStorage.getItem('token');

    // Add authorization header if token exists
    const headers: HeadersInit = {
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

    return handleResponse<T>(response);
  },

  get: <T = any>(url: string, options: RequestInit = {}): Promise<T> => {
    return apiClient.fetch(url, {
      ...options,
      method: 'GET',
    });
  },

  post: <T = any, D = any>(url: string, data: D, options: RequestInit = {}): Promise<T> => {
    return apiClient.fetch(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  put: <T = any, D = any>(url: string, data: D, options: RequestInit = {}): Promise<T> => {
    return apiClient.fetch(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: <T = any>(url: string, options: RequestInit = {}): Promise<T> => {
    return apiClient.fetch(url, {
      ...options,
      method: 'DELETE',
    });
  },
};

export default apiClient;
