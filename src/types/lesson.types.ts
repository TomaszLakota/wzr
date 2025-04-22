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

