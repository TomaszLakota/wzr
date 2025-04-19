/// <reference types="vite/client" />

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LessonThumbnail from '../../components/lesson-thumbnail/LessonThumbnail';
import '../../styles/subscription.scss';
import './LessonsPage.scss';
import apiClient from '../../services/apiClient';

interface UserData {
  isSubscribed: boolean;
  // Add other user properties if available
}

interface Lesson {
  id: string;
  // Add other lesson properties if needed
}

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
        const user: UserData = JSON.parse(userDataString);
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
  const [redirectLoading, setRedirectLoading] = useState(false);
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
          const user: UserData = JSON.parse(userDataString);
          user.isSubscribed = true;
          localStorage.setItem('user', JSON.stringify(user));

          window.dispatchEvent(new Event('authChange'));

          setTimeout(() => {
            // Use React Router's navigation if available, or fallback to window.location
            window.location.href = '/lekcje';
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

  const handleSubscribe = async () => {
    if (!isLoggedIn) {
      // Redirect to login page if user is not logged in
      // Consider using React Router navigation if available
      window.location.href = '/logowanie?redirect=lekcje';
      return;
    }

    setRedirectLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/subscription/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          priceId:
            import.meta.env.VITE_STRIPE_SUBSCRIPTION_PRICE_ID || 'price_1R1C8u2cdengCFrj8fAJanCN',
          successUrl: `${window.location.origin}/lekcje?success=true`,
          cancelUrl: `${window.location.origin}/lekcje?canceled=true`,
        }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        alert('Nie udało się utworzyć sesji płatności. Prosimy spróbować ponownie.');
        setRedirectLoading(false);
      }
    } catch (error) {
      console.error('Błąd podczas tworzenia sesji płatności:', error);
      alert('Wystąpił błąd. Prosimy spróbować ponownie.');
      setRedirectLoading(false);
    }
  };

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

  // Show subscription promo for non-isSubscribed users
  return (
    <div className="subscription-promo">
      <div className="promo-content">
        <h2>Odblokuj Lekcje</h2>
        <p className="promo-description">
          Podnieś swój poziom nauki dzięki naszej subskrypcji lekcji.
        </p>

        <div className="subscription-card">
          <h3>Dostęp do Lekcji</h3>
          <p className="price">90zł miesięcznie</p>
          <p>Podnieś swój poziom nauki dzięki naszej subskrypcji lekcji</p>

          <ul className="feature-list">
            <li>Dostęp do wszystkich lekcji</li>
            <li>Cotygodniowe aktualizacje treści</li>
            <li>Materiały dodatkowe do pobrania</li>
            <li>Anuluj w dowolnym momencie</li>
          </ul>

          <button className="subscribe-button" onClick={handleSubscribe} disabled={redirectLoading}>
            {redirectLoading
              ? 'Przekierowywanie...'
              : isLoggedIn
                ? 'Subskrybuj Teraz'
                : 'Zaloguj się, aby Subskrybować'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonsPage;
