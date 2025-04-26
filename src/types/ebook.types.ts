import { Price } from './stripe.types';

export interface Ebook {
  id: string;
  name: string;
  description: string;
  priceId: string;
  price: number;
  formattedPrice: string;
  currency: string;
  downloadUrl?: string;
  imageUrl?: string;
}

export interface BackendEbook {
  id: string;
  name: string;
  description: string;
  price?: Price;
  download_url?: string;
  image_url?: string;
}
