import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createStores } from './config/storage.js';
import subscriptionRoutes from './routes/subscription.js';
import productRoutes from './routes/products.js';
import apiRoutes from './routes/api.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/userRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import articlesRouter from './routes/articles.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeProducts } from './services/productService.js';
import { initializeTestUser } from './services/userService.js';
import { initializeLessons } from './services/lessonService.js';

dotenv.config();

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

console.log('Starting server with configuration:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', port);
console.log('- Redis URL configured:', !!process.env.REDIS_URL);
console.log('- JWT Secret configured:', !!process.env.JWT_SECRET);

if (!JWT_SECRET) {
  console.error('JWT_SECRET is not defined in environment variables');
  process.exit(1);
}

try {
  // Initialize stores
  const stores = createStores();
  // Make stores globally accessible
  global.stores = stores;

  // Configure CORS
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const corsOptions = isDevelopment
    ? {
        origin: true, // Allow all origins in development
        credentials: true,
      }
    : {
        origin: process.env.FRONTEND_URL,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
      };

  app.use(cors(corsOptions));

  // Webhook routes must be registered before express.json middleware
  // to access raw body data
  app.use('/', webhookRoutes);

  app.use(express.json());

  // API Routes
  app.use('/api', apiRoutes);
  app.use('/api/subscription', subscriptionRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api', authRoutes);
  app.use('/api', userRoutes);
  app.use('/api/articles', articlesRouter);

  // Initialize products and lessons when the server starts
  Promise.all([initializeProducts(), initializeLessons()])
    .then(([productsResult, lessonsResult]) => {
      console.log('Product initialization completed');
      console.log('Lessons initialization completed');

      // Initialize test user in development environment
      if (process.env.NODE_ENV === 'development') {
        initializeTestUser()
          .then((result) => {
            console.log('Test user initialization completed');
          })
          .catch((error) => {
            console.error('Failed to initialize test user:', error);
          });
      }

      // Start the server after initialization is complete
      app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
        console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
      });
    })
    .catch((error) => {
      console.error('Failed to initialize data:', error);
      // Continue starting the server even if initialization fails
      app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
        console.log(`Mode: ${process.env.NODE_ENV || 'development'} (after initialization error)`);
      });
    });

  // Serve static files in production
  if (process.env.NODE_ENV === 'production') {
    // Serve any static files
    app.use(express.static(path.join(__dirname, '../../build')));

    // Handle React routing, return all requests to React app
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../../build', 'index.html'));
    });
  }
} catch (error) {
  console.error('Server initialization error:', error);
  process.exit(1);
}
