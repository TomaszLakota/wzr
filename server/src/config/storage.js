import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';

const isDevelopment = process.env.NODE_ENV !== 'production';

export const createStores = () => {
  // Configure store based on environment
  const store = isDevelopment
    ? undefined // undefined or {} will use in-memory storage
    : new KeyvRedis(process.env.REDIS_URL);

  const options = isDevelopment ? {} : { store };

  const users = new Keyv({ ...options, namespace: 'users' });
  const products = new Keyv({ ...options, namespace: 'products' });
  const orders = new Keyv({ ...options, namespace: 'orders' });

  // Log connection errors
  users.on('error', err => 
    console.error(`Storage Error (${isDevelopment ? 'memory' : 'redis'}):`, err)
  );

  return { users, products, orders };
};