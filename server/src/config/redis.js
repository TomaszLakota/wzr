import Keyv from 'keyv';

const isDevelopment = process.env.NODE_ENV !== 'production';

// Use local Redis in development, Vercel Redis in production
const REDIS_URL = isDevelopment 
  ? 'redis://localhost:6379'
  : process.env.REDIS_URL;

export const createStores = () => {
  const users = new Keyv(REDIS_URL, { namespace: 'users' });
  const products = new Keyv(REDIS_URL, { namespace: 'products' });
  const orders = new Keyv(REDIS_URL, { namespace: 'orders' });

  // Log connection errors
  users.on('error', err => 
    console.error(`Redis Connection Error (${isDevelopment ? 'local' : 'production'}):`, err)
  );

  return { users, products, orders };
};