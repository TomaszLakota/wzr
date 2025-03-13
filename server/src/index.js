import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createStores } from './config/storage.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize stores
const { users, products, orders } = createStores();

app.use(cors());
app.use(express.json());

// API Routes
app.post('/api/register', async (req, res) => {
  const { email, password, name } = req.body;
  
  // Input validation
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Password strength validation
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }
  
  try {
    const existingUser = await users.get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = {
      email,
      name,
      password: hashedPassword,
      createdAt: Date.now()
    };

    await users.set(email, user);
    
    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({
      message: 'Registration successful',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users/:email', async (req, res) => {
  try {
    const user = await users.get(req.params.email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
});