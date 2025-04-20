import { BackendEbook, Ebook } from '../types/ebook.types';
import apiClient from './apiClient';

const API_BASE_URL = import.meta.env.API_URL || 'http://localhost:3000/api';

export const getEbooks = async (): Promise<Ebook[]> => {
  try {
    const response = await apiClient.get<BackendEbook[]>(`${API_BASE_URL}/ebooks/`);
    return response.map(mapEbookToFrontend);
  } catch (error: unknown) {
    console.error(
      'Błąd podczas pobierania ebooków:',
      error instanceof Error ? error.message : error
    );
    throw error;
  }
};

export const getPurchasedEbooks = async (): Promise<Ebook[]> => {
  try {
    if (!localStorage.getItem('token')) {
      throw new Error('Użytkownik nie jest zalogowany');
    }
    return await apiClient.get<Ebook[]>(`${API_BASE_URL}/ebooks/user/purchased`);
  } catch (error: unknown) {
    console.error(
      'Błąd podczas pobierania zakupionych ebooków:',
      error instanceof Error ? error.message : error
    );
    throw error;
  }
};

const mapEbookToFrontend = (ebook: BackendEbook): Ebook => {
  return {
    ...ebook,
    imageUrl: ebook.image_url || '',
    priceId: ebook.price?.id || '',
    price: ebook.price?.unit_amount || 0,
    formattedPrice: ebook.price?.formatted || '',
    currency: ebook.price?.currency || '',
  };
};
