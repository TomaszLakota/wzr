export interface Exercise {
  name: string;
  url: string;
}

export interface LessonData {
  title: string;
  videoUrl: string;
  level: string;
  duration: string;
  description: string;
  exercises?: Exercise[];
}

export interface Lesson {
  id: string | number;
  thumbnailUrl?: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  slug: string;
  videoUrl: string;
}
