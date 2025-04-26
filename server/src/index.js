import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createSupabaseClient } from './config/storage.js';
import apiRoutes from './routes/index.js';
import { standardLimiter } from './middleware/rateLimiter.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('JWT_SECRET is not defined in environment variables');
  process.exit(1);
}

try {
  const supabase = createSupabaseClient();
  app.locals.supabase = supabase;

  // Configure CORS based on environment
  const nodeEnv = process.env.NODE_ENV;
  const frontendUrl = process.env.FRONTEND_URL;
  let allowedOrigin;

  if (nodeEnv === 'production') {
    allowedOrigin = frontendUrl;
    if (!allowedOrigin) {
      console.error(
        'FATAL: FRONTEND_URL environment variable is required but not set in production!'
      );
      process.exit(1);
    }
  } else {
    allowedOrigin = frontendUrl || true;
  }

  const corsOptions = {
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  };

  app.use(cors(corsOptions));

  app.use(express.json());

  // Apply rate limiting to all routes
  app.use(standardLimiter);

  // API Routes
  app.use('/api', apiRoutes);

  if (nodeEnv === 'development') {
    app.listen(port, () => {
      console.log(`Server listening locally at http://localhost:${port}`);
    });
  }
} catch (error) {
  console.error('Server initialization error:', error);
  process.exit(1);
}

// Export the app instance for Vercel
export default app;
