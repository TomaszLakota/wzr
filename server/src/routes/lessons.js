import express from 'express';
import { getAllLessons, getLessonById } from '../services/lessonService.js';

const router = express.Router();

// Wrapper for getAllLessons
router.get('/', async (req, res, next) => {
  const supabase = req.app.locals.supabase; // Get supabase from app context
  try {
    const lessons = await getAllLessons(supabase);
    res.json(lessons);
  } catch (error) {
    console.error('Error in GET /lekcje route:', error);
    res.status(500).json({ error: 'Nie udało się pobrać lekcji' });
    // next(error); // Optionally pass to an error handling middleware
  }
});

// Wrapper for getLessonById
router.get('/:id', async (req, res, next) => {
  const supabase = req.app.locals.supabase; // Get supabase from app context
  const { id } = req.params;
  try {
    const lesson = await getLessonById(supabase, id);
    if (lesson) {
      res.json(lesson);
    } else {
      res.status(404).json({ error: 'Nie znaleziono lekcji' });
    }
  } catch (error) {
    console.error(`Error in GET /lekcje/${id} route:`, error);
    res.status(500).json({ error: 'Nie udało się pobrać lekcji' });
    // next(error);
  }
});

export default router;
