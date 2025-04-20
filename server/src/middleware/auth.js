import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Dostęp wymaga uwierzytelnienia' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token jest nieprawidłowy lub wygasł' });
    }

    req.user = user;
    next();
  });
};

/**
 * Middleware to check if user is admin
 */
const isAdmin = async (req, res, next) => {
  // Ensure user is authenticated first
  if (!req.user?.userId) {
    return res.status(401).json({ error: 'Brak uwierzytelnienia lub ID użytkownika' });
  }

  try {
    const supabase = req.app.locals.supabase;
    const userId = req.user.userId;

    const { data: user, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user for admin check:', error);
      return res.status(500).json({ error: 'Błąd podczas sprawdzania uprawnień' });
    }

    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Brak uprawnień administratora' });
    }

    next();
  } catch (error) {
    console.error('Error checking admin status:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

export { authenticateToken, isAdmin };
