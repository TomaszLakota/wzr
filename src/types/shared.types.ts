export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

declare global {
  interface Window {
    clientSecret?: string;
  }
}
