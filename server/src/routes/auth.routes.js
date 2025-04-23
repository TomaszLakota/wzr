import express from 'express';
import {
  register,
  login,
  activateAccount,
} from '../controllers/auth.controller.js';

const router = express.Router();

// Register endpoint - Use the controller function
router.post('/register', register);

// Login endpoint - Use the controller function
router.post('/login', login);

// Activate account endpoint - Add the new route
router.post('/activate', activateAccount);


export default router;
