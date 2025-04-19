import apiClient from './apiClient';

// Define a basic interface for an Ebook
// Adjust properties based on the actual data structure returned by your API
interface Ebook {
  id: string;
  title: string;
  description: string;
  priceId?: string; // Optional if not always present
  price?: number; // Example price property
  currency?: string; // Example currency property
  downloadUrl?: string; // Only for purchased ebooks
}

// Use `as string` to assert the type if env var might be undefined but you expect a default
const API_BASE_URL = (import.meta.env.API_URL || 'http://localhost:3000/api') as string;

/**
 * Get all available ebooks from the backend
 * @returns {Promise<Ebook[]>} - Array of ebooks with prices
 */
export const getEbooks = (): Promise<Ebook[]> => {
  return apiClient.get<Ebook[]>(`${API_BASE_URL}/ebooks`);
};

/**
 * Get user's purchased ebooks
 * @returns {Promise<Ebook[]>} - Array of purchased ebooks
 */
export const getPurchasedEbooks = async (): Promise<Ebook[]> => {
  try {
    if (!localStorage.getItem('token')) {
      // Return an empty array or throw an error depending on desired behavior for non-logged-in users
      // Throwing error seems more appropriate here based on original code
      throw new Error('Użytkownik nie jest zalogowany');
    }
    // Specify the expected return type for apiClient.get
    return await apiClient.get<Ebook[]>(`${API_BASE_URL}/user/ebooks`);
  } catch (error: unknown) {
    console.error(
      'Błąd podczas pobierania zakupionych ebooków:',
      error instanceof Error ? error.message : error
    );
    // Re-throw the error or return an empty array/handle it as needed
    throw error;
  }
};
