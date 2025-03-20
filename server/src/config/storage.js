import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';

const isDevelopment = process.env.NODE_ENV !== 'production';

export const createStores = () => {
  try {
    const store = isDevelopment ? undefined : new KeyvRedis(process.env.REDIS_URL);

    const options = isDevelopment ? {} : { store };

    const users = new Keyv({ ...options, namespace: 'users' });
    const products = new Keyv({ ...options, namespace: 'products' });
    const orders = new Keyv({ ...options, namespace: 'orders' });

    users.on('error', (err) => console.error('Storage Error:', err));

    return { users, products, orders };
  } catch (error) {
    console.error('Store initialization error:', error);
    throw error;
  }
};
