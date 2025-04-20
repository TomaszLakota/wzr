import { createClient } from '@supabase/supabase-js';

// Function to create and export the Supabase client instance for the backend
export const createSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Supabase URL or Service Role Key is missing. Please check your .env file.');
    throw new Error('Supabase URL or Service Role Key not configured.');
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {});
    return supabase;
  } catch (error) {
    console.error('Supabase client initialization error:', error);
    throw error;
  }
};
