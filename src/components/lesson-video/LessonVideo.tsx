import React from 'react';
import './LessonVideo.scss';

interface Lesson {
  videoUrl: string;
  title: string;
}

interface LessonVideoProps {
  lesson: Lesson;
}

const LessonVideo: React.FC<LessonVideoProps> = ({ lesson }) => {
  // No need for the null check for videoUrl here as the type ensures it exists.
  // If it *can* be null/undefined, the Lesson interface should reflect that.
  // Assuming videoUrl is required based on the original logic showing nothing if it's missing.
  if (!lesson.videoUrl) {
    console.warn('LessonVideo component received lesson without videoUrl:', lesson);
    return <div className="lesson-video--no-video">Brak dostępnego wideo dla tej lekcji.</div>;
  }

  return (
    <div className="lesson-video">
      <iframe
        src={lesson.videoUrl}
        loading="lazy"
        title={lesson.title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default LessonVideo;
