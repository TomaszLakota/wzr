import React from 'react';
import './LessonThumbnail.scss';

const LessonThumbnail = ({ lesson }) => {
  return (
    <div className="lesson-thumbnail">
      <div className="lesson-thumbnail__image">
        {lesson.thumbnailUrl ? (
          <img src={lesson.thumbnailUrl} alt={lesson.title} />
        ) : (
          <div className="lesson-thumbnail__placeholder">
            <span>{lesson.title[0]}</span>
          </div>
        )}
      </div>
      <div className="lesson-thumbnail__content">
        <h3 className="lesson-thumbnail__title">{lesson.title}</h3>
        <p className="lesson-thumbnail__description">{lesson.description}</p>
        <div className="lesson-thumbnail__meta">
          <span className="lesson-thumbnail__level">{lesson.level}</span>
          <span className="lesson-thumbnail__duration">{lesson.duration}</span>
        </div>
      </div>
    </div>
  );
};

export default LessonThumbnail; 