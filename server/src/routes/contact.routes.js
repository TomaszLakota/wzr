import express from 'express';
import { handleContactForm } from '../controllers/contact.controller.js';
import { contactLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply contact-specific rate limiter to this route
router.post('/contact', contactLimiter, handleContactForm);

export default router;
