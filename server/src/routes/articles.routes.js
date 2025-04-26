import express from 'express';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase URL or Anon Key. Make sure they are set in your environment variables.'
  );
  // Optionally throw an error or exit if critical
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Endpoint to get all articles (only title, slug, and preview)
router.get('/', async (req, res) => {
  try {
    const { data: articles, error } = await supabase
      .from('articles')
      .select('slug, title, preview, created_at');

    if (error) throw error;

    res.json(articles);
  } catch (error) {
    console.error('Error fetching article previews:', error.message);
    res.status(500).json({ message: 'Błąd podczas pobierania zapowiedzi artykułów' });
  }
});

// Endpoint to get a specific article by slug
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const { data: article, error } = await supabase
      .from('articles')
      .select('*') // Select all columns for a single article
      .eq('slug', slug)
      .single(); // Expect a single result

    if (error) {
      // If error is due to no rows found, send 404
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'Artykuł nie znaleziony' });
      }
      throw error; // Re-throw other errors
    }

    if (article) {
      res.json(article);
    } else {
      // This case might be redundant due to .single() and error handling above,
      // but kept for explicit clarity.
      res.status(404).json({ message: 'Artykuł nie znaleziony' });
    }
  } catch (error) {
    console.error(`Error fetching article with slug ${slug}:`, error.message);
    res.status(500).json({ message: 'Błąd podczas pobierania artykułu' });
  }
});

export default router;
