import { getVideoStreamUrl } from './video.controller.js';

const addVideoUrl = (lesson) => ({
  ...lesson,
  videoUrl: lesson.videoId ? getVideoStreamUrl(lesson.videoId) : null,
});

// Get all lessons from Supabase
export const getAllLessons = async (supabase) => {
  try {
    const { data: allLessons, error } = await supabase.from('lessons').select('*');

    if (error) {
      console.error('Error fetching lessons:', error);
      throw error;
    }

    return allLessons.map(addVideoUrl);
  } catch (error) {
    console.error('Error in getAllLessons service:', error);
    throw new Error('Failed to fetch lessons');
  }
};

// Get lesson by ID from Supabase, including downloads
export const getLessonById = async (supabase, id) => {
  try {
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('*, downloads(*)')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching lesson ${id}:`, error);
      throw error;
    }

    return lesson ? addVideoUrl(lesson) : null;
  } catch (error) {
    console.error(`Error in getLessonById service for ID ${id}:`, error);
    throw new Error('Failed to fetch lesson');
  }
};

// Create or update a lesson in Supabase
export const upsertLesson = async (supabase, lessonData) => {
  console.log(`[UPSERT_LESSON] Upserting lesson with ID: ${lessonData.id || '(new)'}...`);
  const { videoUrl, ...dbLessonData } = lessonData;

  try {
    const { data, error } = await supabase
      .from('lessons')
      .upsert(dbLessonData, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('[UPSERT_LESSON] Error upserting lesson:', error);
      throw error;
    }
    console.log(`[UPSERT_LESSON] Lesson ${data.id} upserted successfully.`);
    return addVideoUrl(data);
  } catch (error) {
    console.error('Error in upsertLesson service:', error);
    throw new Error('Failed to save lesson');
  }
};

// Delete a lesson from Supabase
export const deleteLesson = async (supabase, id) => {
  console.log(`[DELETE_LESSON] Deleting lesson ${id}...`);
  try {
    const { error } = await supabase.from('lessons').delete().eq('id', id);

    if (error) {
      console.error(`Error deleting lesson ${id}:`, error);
      throw error;
    }
    console.log(`[DELETE_LESSON] Lesson ${id} deleted successfully.`);
    return { success: true }; // Indicate success
  } catch (error) {
    console.error(`Error in deleteLesson service for ID ${id}:`, error);
    throw new Error('Failed to delete lesson');
  }
};
