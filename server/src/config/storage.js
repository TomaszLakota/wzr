import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';

const isDevelopment = process.env.NODE_ENV !== 'production';

// Helper function to add getAll functionality to Keyv instance
const extendKeyvWithGetAll = (keyv) => {
  keyv.getAll = async () => {
    const iterator = keyv.iterator();
    const items = [];
    for await (const [, value] of iterator) {
      items.push(value);
    }
    return items;
  };
  return keyv;
};

export const createStores = () => {
  try {
    const store = isDevelopment ? undefined : new KeyvRedis(process.env.REDIS_URL);

    const options = isDevelopment ? {} : { store };

    const users = extendKeyvWithGetAll(new Keyv({ ...options, namespace: 'users' }));
    const products = extendKeyvWithGetAll(new Keyv({ ...options, namespace: 'products' }));
    const orders = extendKeyvWithGetAll(new Keyv({ ...options, namespace: 'orders' }));

    users.on('error', (err) => console.error('Storage Error:', err));

    return { users, products, orders };
  } catch (error) {
    console.error('Store initialization error:', error);
    throw error;
  }
};
