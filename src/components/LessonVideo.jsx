import React from 'react';
import './LessonVideo.scss';

const LessonVideo = ({ lesson }) => {
  if (!lesson.videoUrl) {
    return null;
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