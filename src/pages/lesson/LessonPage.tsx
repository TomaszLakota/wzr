import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './LessonPage.scss';
import Lesson from '../../components/lesson-/Lesson';

const LessonPage = () => {
  const { id } = useParams();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const response = await fetch(`/api/lekcje/${id}`);
        if (!response.ok) {
          throw new Error('Nie udało się pobrać lekcji');
        }
        const data = await response.json();
        setLesson(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [id]);

  if (loading) {
    return (
      <div className="lesson-page">
        <div className="lesson-page__loading">Ładowanie...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lesson-page">
        <div className="lesson-page__error">{error}</div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="lesson-page">
        <div className="lesson-page__error">Nie znaleziono lekcji</div>
      </div>
    );
  }

  return (
    <div className="lesson-page">
      <Lesson lesson={lesson} />
    </div>
  );
};

export default LessonPage;
