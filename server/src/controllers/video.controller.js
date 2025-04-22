import fetch from 'node-fetch';

const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;

// List all videos in the library
export const listVideos = async () => {
  try {
    const response = await fetch(`https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`, {
      headers: {
        AccessKey: BUNNY_API_KEY,
        accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching videos from Bunny.net:', error);
    throw error;
  }
};

// Get a single video by ID
export const getVideo = async (videoId) => {
  try {
    const response = await fetch(
      `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
      {
        headers: {
          AccessKey: BUNNY_API_KEY,
          accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching video ${videoId} from Bunny.net:`, error);
    throw error;
  }
};

// Get the HLS streaming URL for a video
export const getVideoStreamUrl = (videoId) => {
  return `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${videoId}`;
};
