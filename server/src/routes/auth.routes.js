import express from 'express';
import {
  register,
  login,
  activateAccount,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';

const router = express.Router();

// Register endpoint - Use the controller function
router.post('/register', register);

// Login endpoint - Use the controller function
router.post('/login', login);

// Activate account endpoint - Add the new route
router.post('/activate', activateAccount);

// Forgot password endpoint
router.post('/forgot-password', forgotPassword);

// Reset password endpoint
router.post('/reset-password', resetPassword);

export default router;
