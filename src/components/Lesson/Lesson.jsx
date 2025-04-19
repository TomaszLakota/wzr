import React from 'react';
import PropTypes from 'prop-types';
import './Lesson.scss';

const Lesson = ({ lesson }) => {
  const {
    title,
    videoUrl,
    level,
    duration,
    description,
    exercises = []
  } = lesson;

  const separator = videoUrl.includes('?') ? '&' : '?';
  const finalVideoUrl = `${videoUrl}${separator}preload=false`;

  return (
    <div className="lesson">
      <h1 className="lesson__title">{title}</h1>
      
      <div className="lesson__video-container">
        {/* Bunny.net video player */}
        <iframe 
          className="lesson__video"
          src={finalVideoUrl}
          loading="lazy"
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
        <p>{description}</p>
      </div>

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

Lesson.propTypes = {
  lesson: PropTypes.shape({
    title: PropTypes.string.isRequired,
    videoUrl: PropTypes.string.isRequired,
    level: PropTypes.string.isRequired,
    duration: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    exercises: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        url: PropTypes.string.isRequired,
      })
    ),
  }).isRequired,
};

export default Lesson; 