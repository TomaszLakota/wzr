import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createStores } from './config/storage.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize stores
const { users, products, orders } = createStores();

app.use(cors());
app.use(express.json());

// API Routes
app.post('/api/users', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const existingUser = await users.get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = {
      email,
      password, // Note: Hash this in production!
      createdAt: Date.now()
    };

    await users.set(email, user);
    res.status(201).json({ message: 'User created' });
  } catch (error) {
    console.error('Error creating user:', error);
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