import React from 'react';
import './Lesson.scss';

interface Exercise {
  name: string;
  url: string;
}

interface LessonData {
  title: string;
  videoUrl: string;
  level: string;
  duration: string;
  description: string;
  exercises?: Exercise[]; //
}

interface LessonProps {
  lesson: LessonData;
}

const Lesson: React.FC<LessonProps> = ({ lesson }) => {
  const {
    title,
    videoUrl,
    level,
    duration,
    description,
    exercises = [], // Keep default value for runtime safety if API might omit it
  } = lesson;

  const separator = videoUrl.includes('?') ? '&' : '?';
  const finalVideoUrl = `${videoUrl}${separator}preload=false`;

  return (
    <div className="lesson">
      <h1 className="lesson__title">{title}</h1>

      <div className="lesson__video-container">
        {/* Bunny.net video player iframe remains the same */}
        <iframe
          className="lesson__video"
          src={finalVideoUrl}
          loading="lazy"
          title={title} // Add title attribute for accessibility
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen={true}
        ></iframe>
      </div>

      <div className="lesson__meta">
        <div className="lesson__meta-item">
          <span className="lesson__meta-label">Poziom:</span>
          <span className="lesson__meta-value">{level}</span>
        </div>
        <div className="lesson__meta-item">
          <span className="lesson__meta-label">Czas trwania:</span>
          <span className="lesson__meta-value">{duration}</span>
        </div>
      </div>

      <div className="lesson__description">
        <h2>Opis</h2>
        {/* Render description safely, handle potential newlines if needed */}
        <p>{description}</p>
      </div>

      {/* Check exercises array length before mapping */}
      {exercises.length > 0 && (
        <div className="lesson__exercises">
          <h2>Materiały do pobrania</h2>
          <ul className="lesson__exercises-list">
            {exercises.map((exercise, index) => (
              <li key={index} className="lesson__exercise-item">
                <a
                  href={exercise.url}
                  download
                  className="lesson__exercise-link"
                  // Consider adding target="_blank" rel="noopener noreferrer" for external links
                >
                  {exercise.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Lesson;
