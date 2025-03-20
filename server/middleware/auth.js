import jwt from 'jsonwebtoken';

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = (req, res, next) => {
  // Get the authorization header
  const authHeader = req.headers['authorization'];

  // Check if header exists and has the Bearer format
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Dostęp wymaga uwierzytelnienia' });
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token jest nieprawidłowy lub wygasł' });
    }

    // Add the user info to the request
    req.user = user;
    next();
  });
};

export { authenticateToken };
