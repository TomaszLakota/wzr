import { lessons as mockLessons } from '../mocks/mock-lessons.js';

// Initialize lessons in the store
export const initializeLessons = async () => {
  try {
    const { lessons } = global.stores;

    // In development, use mock data
    if (process.env.NODE_ENV === 'development') {
      console.log('Initializing mock lessons in development mode');

      for (const lesson of mockLessons) {
        await lessons.set(lesson.id.toString(), lesson);
      }

      console.log(`Initialized ${mockLessons.length} mock lessons`);
      return { success: true, message: 'Mock lessons initialized' };
    }

    // In production, check if lessons exist
    const existingLessons = await lessons.getAll();
    if (existingLessons.length > 0) {
      console.log(`Found ${existingLessons.length} existing lessons`);
      return { success: true, message: 'Lessons already exist' };
    }

    // If no lessons exist in production, initialize with mock data
    // This is temporary until we have a proper admin interface
    console.log('No lessons found in production, initializing with mock data');
    for (const lesson of mockLessons) {
      await lessons.set(lesson.id.toString(), lesson);
    }

    console.log(`Initialized ${mockLessons.length} lessons in production`);
    return { success: true, message: 'Lessons initialized in production' };
  } catch (error) {
    console.error('Error initializing lessons:', error);
    return { success: false, error: error.message };
  }
};

// Get all lessons
export const getAllLessons = async () => {
  try {
    const { lessons } = global.stores;
    return await lessons.getAll();
  } catch (error) {
    console.error('Error fetching lessons:', error);
    throw error;
  }
};

// Get lesson by ID
export const getLessonById = async (id) => {
  try {
    const { lessons } = global.stores;
    return await lessons.get(id.toString());
  } catch (error) {
    console.error(`Error fetching lesson ${id}:`, error);
    throw error;
  }
};

// Create or update a lesson
export const upsertLesson = async (lesson) => {
  try {
    const { lessons } = global.stores;
    await lessons.set(lesson.id.toString(), lesson);
    return lesson;
  } catch (error) {
    console.error('Error upserting lesson:', error);
    throw error;
  }
};

// Delete a lesson
export const deleteLesson = async (id) => {
  try {
    const { lessons } = global.stores;
    return await lessons.delete(id.toString());
  } catch (error) {
    console.error(`Error deleting lesson ${id}:`, error);
    throw error;
  }
};
