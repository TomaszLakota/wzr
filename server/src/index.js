import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createSupabaseClient } from './config/storage.js';
import apiRoutes from './routes/api.js';
import webhookRoutes from './routes/webhookRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

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
console.log('- JWT Secret configured:', !!process.env.JWT_SECRET);

if (!JWT_SECRET) {
  console.error('JWT_SECRET is not defined in environment variables');
  process.exit(1);
}

try {
  // Initialize Supabase client
  const supabase = createSupabaseClient();
  // Make Supabase client accessible to routes/middleware
  app.locals.supabase = supabase;

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

  // Start the server
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
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
