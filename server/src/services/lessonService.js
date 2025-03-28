import { lessons as mockLessons } from '../mocks/mock-lessons.js';
import { listVideos, getVideoStreamUrl } from './videoService.js';

const addVideoUrl = (lesson) => ({
  ...lesson,
  videoUrl: lesson.videoId ? getVideoStreamUrl(lesson.videoId) : null,
});

// Initialize lessons in the store
export const initializeLessons = async () => {
  try {
    const { lessons } = global.stores;

    // Get videos from Bunny.net
    let videos = [];
    try {
      videos = await listVideos();
      console.log(`Found ${videos.length} videos in Bunny.net`);
    } catch (error) {
      console.error('Error fetching videos from Bunny.net:', error);
    }

    // In development, use mock data
    if (process.env.NODE_ENV === 'development') {
      console.log('Initializing mock lessons in development mode');
      const lessonsWithVideos = mockLessons.map(addVideoUrl);

      for (const lesson of lessonsWithVideos) {
        await lessons.set(lesson.id.toString(), lesson);
      }

      console.log(`Initialized ${lessonsWithVideos.length} mock lessons`);
      return { success: true, message: 'Mock lessons initialized' };
    }

    // In production, check if lessons exist
    const existingLessons = await lessons.getAll();
    if (existingLessons.length > 0) {
      console.log(`Found ${existingLessons.length} existing lessons`);
      return { success: true, message: 'Lessons already exist' };
    }

    // In production with no lessons, return empty state
    // This should be handled by admin interface for adding real lessons
    console.log('No lessons found in production');
    return { success: true, message: 'No lessons exist in production' };
  } catch (error) {
    console.error('Error initializing lessons:', error);
    return { success: false, error: error.message };
  }
};

// Get all lessons
export const getAllLessons = async () => {
  try {
    const { lessons } = global.stores;
    const allLessons = await lessons.getAll();
    return allLessons.map(addVideoUrl);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    throw error;
  }
};

// Get lesson by ID
export const getLessonById = async (id) => {
  try {
    const { lessons } = global.stores;
    const lesson = await lessons.get(id.toString());
    return lesson ? addVideoUrl(lesson) : null;
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
    return addVideoUrl(lesson);
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
