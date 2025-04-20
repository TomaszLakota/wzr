import React from 'react';
import './LessonThumbnail.scss';

export interface Lesson {
  id: string | number;
  thumbnailUrl?: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  slug: string;
}

interface LessonThumbnailProps {
  lesson: Lesson;
}

const LessonThumbnail: React.FC<LessonThumbnailProps> = ({ lesson }) => {
  return (
    // Consider wrapping this in a Link if these thumbnails navigate somewhere
    // import { Link } from 'react-router-dom';
    // <Link to={`/lekcje/${lesson.slug || lesson.id}`} className="lesson-thumbnail-link">
    <div className="lesson-thumbnail">
      <div className="lesson-thumbnail__image">
        {lesson.thumbnailUrl ? (
          <img src={lesson.thumbnailUrl} alt={lesson.title} />
        ) : (
          <div className="lesson-thumbnail__placeholder">
            {/* Displaying first letter might not be ideal, consider a generic icon */}
            <span>{lesson.title ? lesson.title[0].toUpperCase() : 'L'}</span>
          </div>
        )}
      </div>
      <div className="lesson-thumbnail__content">
        <h3 className="lesson-thumbnail__title">{lesson.title}</h3>
        {/* Consider truncating long descriptions */}
        <p className="lesson-thumbnail__description">{lesson.description}</p>
        <div className="lesson-thumbnail__meta">
          <span className="lesson-thumbnail__level">Poziom: {lesson.level}</span>
          <span className="lesson-thumbnail__duration">Czas: {lesson.duration}</span>
        </div>
      </div>
    </div>
    // </Link>
  );
};

export default LessonThumbnail;
