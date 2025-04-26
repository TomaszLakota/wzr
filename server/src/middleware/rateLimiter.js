import { rateLimit } from 'express-rate-limit';

export const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zbyt wiele żądań, spróbuj ponownie później' },
  skipSuccessfulRequests: false,
});

export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zbyt wiele prób logowania, spróbuj ponownie później' },
  skipSuccessfulRequests: false,
});

export const zeroLimiter = (req, res, next) => {
  next();
};
