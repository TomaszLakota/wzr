import express from 'express';
const router = express.Router();
import { mockArticles } from '../mocks/mockData.js';

// Endpoint to get all articles (only title and slug for preview)
router.get('/', (req, res) => {
  const previews = mockArticles.map(({ slug, title, preview }) => ({ slug, title, preview }));
  res.json(previews);
});

// Endpoint to get a specific article by slug
router.get('/:slug', (req, res) => {
  const { slug } = req.params;
  const article = mockArticles.find((art) => art.slug === slug);

  if (article) {
    res.json(article);
  } else {
    res.status(404).json({ message: 'Artykuł nie znaleziony' });
  }
});

export default router;
