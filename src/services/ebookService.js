import apiClient from './apiClient';

const API_BASE_URL = import.meta.env.API_URL || 'http://localhost:3000/api';

/**
 * Get all available ebooks from the backend
 * @returns {Promise<Array>} - Array of ebooks with prices
 */
export const getEbooks = () => {
  return apiClient.get(`${API_BASE_URL}/ebooks`);
};

/**
 * Get user's purchased ebooks
 * @returns {Promise<Array>} - Array of purchased ebooks
 */
export const getPurchasedEbooks = async () => {
  try {
    if (!localStorage.getItem('token')) {
      throw new Error('Użytkownik nie jest zalogowany');
    }
    return await apiClient.get(`${API_BASE_URL}/user/ebooks`);
  } catch (error) {
    console.error('Błąd podczas pobierania zakupionych ebooków:', error);
    throw error;
  }
};
