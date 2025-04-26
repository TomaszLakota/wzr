import React from 'react';
import './LessonVideo.scss';
import { Lesson } from '../../types/lesson.types';

export interface LessonVideoProps {
  lesson: Lesson;
}


const LessonVideo: React.FC<LessonVideoProps> = ({ lesson }) => {
  if (!lesson.videoUrl) {
    console.warn('LessonVideo component received lesson without videoUrl:', lesson);
    return <div className="lesson-video--no-video">Błąd podczas ładowania wideo.</div>;
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
