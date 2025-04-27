/// <reference types="vite/client" />

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LessonThumbnail from '../../components/lesson-thumbnail/LessonThumbnail';
import './LessonsPage.scss';
import apiClient from '../../services/apiClient';
import { User } from '../../types/user.types';
import { Lesson } from '../../types/lesson.types';
import SubscriptionPromo from '../../components/subscription/SubscriptionPromo';

// Create a proper auth hook that uses the API
const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('token');
      const userDataString = localStorage.getItem('user');

      if (!token || !userDataString) {
        setIsLoggedIn(false);
        setIsSubscribed(false);
        setIsLoading(false);
        return;
      }

      try {
        const user: User = JSON.parse(userDataString);
        console.log('user', user);
        setIsLoggedIn(true);
        setIsSubscribed(user.isSubscribed);
      } catch (e) {
        console.error('Failed to parse user data', e);
        // Handle potential JSON parsing error
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        setIsSubscribed(false);
      }
      setIsLoading(false);
    };

    checkAuthStatus();
    window.addEventListener('authChange', checkAuthStatus);
    window.addEventListener('storage', checkAuthStatus);

    return () => {
      window.removeEventListener('authChange', checkAuthStatus);
      window.removeEventListener('storage', checkAuthStatus);
    };
  }, []);

  return { isLoggedIn, isSubscribed, isLoading };
};

const LessonsPage: React.FC = () => {
  const { isLoggedIn, isSubscribed, isLoading } = useAuth();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessonsError, setLessonsError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Check if user just completed subscription purchase
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isSuccess = urlParams.get('success') === 'true';

    if (isSuccess) {
      setShowSuccess(true);
      const userDataString = localStorage.getItem('user');
      if (userDataString) {
        try {
          const user: User = JSON.parse(userDataString);
          user.isSubscribed = true;
          localStorage.setItem('user', JSON.stringify(user));

          window.dispatchEvent(new Event('authChange'));

          setTimeout(() => {
            navigate('/lekcje');
          }, 3000);
        } catch (e) {
          console.error('Failed to update user data after success', e);
        }
      }
    }
  }, []);

  useEffect(() => {
    const fetchLessons = async () => {
      if (!isLoggedIn || !isSubscribed) return;

      setLessonsLoading(true);
      setLessonsError(null);

      try {
        const data = await apiClient.get('/api/lekcje');
        setLessons(data);
      } catch (error) {
        console.error('Error fetching lessons:', error);
        setLessonsError('Wystąpił błąd podczas ładowania lekcji');
      } finally {
        setLessonsLoading(false);
      }
    };

    if (!isLoading) {
      fetchLessons();
    }
  }, [isLoggedIn, isSubscribed, isLoading]);

  if (isLoading) {
    return <div className="loading">Ładowanie...</div>;
  }

  if (showSuccess) {
    return (
      <div className="lessons-page">
        <div className="success-message">
          <h2>Dziękujemy za subskrypcję!</h2>
          <p>Twoja subskrypcja została pomyślnie aktywowana.</p>
        </div>
      </div>
    );
  }

  // Show lessons content if user is logged in and isSubscribed
  if (isLoggedIn && isSubscribed) {
    return (
      <div className="lessons-page">
        <h1>Lekcje</h1>
        {lessonsLoading ? (
          <div className="loading">Ładowanie lekcji...</div>
        ) : lessonsError ? (
          <div className="error-message">{lessonsError}</div>
        ) : (
          <div className="lessons-grid">
            {lessons.map((lesson) => (
              <Link to={`/lekcje/${lesson.id}`} key={lesson.id} className="lessons-grid__item">
                <LessonThumbnail lesson={lesson} />
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Show subscription promo for non-subscribed users using the SubscriptionPromo component
  return <SubscriptionPromo isLoggedIn={isLoggedIn} />;
};

export default LessonsPage;
