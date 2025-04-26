import express from 'express';
import {
  register,
  login,
  activateAccount,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(authLimiter);

router.post('/register', register);

router.post('/login', login);

router.post('/activate', activateAccount);

router.post('/forgot-password', forgotPassword);

router.post('/reset-password', resetPassword);

export default router;
