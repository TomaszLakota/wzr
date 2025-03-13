import Keyv from 'keyv';

const isDevelopment = process.env.NODE_ENV !== 'production';

export const createStores = () => {
  // In development, use in-memory storage
  // In production, use Redis
  const options = isDevelopment 
    ? {} // Empty options uses in-memory storage
    : { store: process.env.REDIS_URL };

  const users = new Keyv(options, { namespace: 'users' });
  const products = new Keyv(options, { namespace: 'products' });
  const orders = new Keyv(options, { namespace: 'orders' });

  users.on('error', err => 
    console.error(`Storage Error (${isDevelopment ? 'memory' : 'redis'}):`, err)
  );

  return { users, products, orders };
};