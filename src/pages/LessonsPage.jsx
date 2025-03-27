import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LessonThumbnail from '../components/LessonThumbnail';
import '../styles/subscription.scss';
import './LessonsPage.scss';
import apiClient from '../services/apiClient';

// Create a proper auth hook that uses the API
const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (!token || !userData) {
        setIsLoggedIn(false);
        setIsSubscribed(false);
        setIsLoading(false);
        return;
      }
      
      const user = JSON.parse(userData);
      setIsLoggedIn(true);
      setIsSubscribed(user.isSubscribed);
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

const LessonsPage = () => {
  const { isLoggedIn, isSubscribed, isLoading } = useAuth();
  const [redirectLoading, setRedirectLoading] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessonsError, setLessonsError] = useState(null);

  useEffect(() => {
    const fetchLessons = async () => {
      if (!isLoggedIn || !isSubscribed) return;
      
      setLessonsLoading(true);
      setLessonsError(null);
      
      try {
        const data = await apiClient.get('/api/lessons');
        setLessons(data);
      } catch (error) {
        console.error('Error fetching lessons:', error);
        setLessonsError('Wystąpił błąd podczas ładowania lekcji');
      } finally {
        setLessonsLoading(false);
      }
    };
    
    fetchLessons();
  }, [isLoggedIn, isSubscribed]);
  
  const handleSubscribe = async () => {
    if (!isLoggedIn) {
      // Redirect to login page if user is not logged in
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
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          priceId: import.meta.env.VITE_STRIPE_SUBSCRIPTION_PRICE_ID || "price_1R1C8u2cdengCFrj8fAJanCN",
          successUrl: `${window.location.origin}/lekcje?success=true`,
          cancelUrl: `${window.location.origin}/lekcje?canceled=true`
        })
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

  // Check if user just completed subscription purchase
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('success') === 'true') {
    // Update local storage to set isSubscribed to true
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      user.isSubscribed = true;
      localStorage.setItem('user', JSON.stringify(user));
      
      // Dispatch custom event to notify Header component
      window.dispatchEvent(new Event('authChange'));
    }
    
    const handleGoToLessons = () => {
      // Set isSubscribed directly in this component
      setIsSubscribed(true);
      // Navigate programmatically to ensure state updates before rendering
      window.location.href = '/lekcje';
    };
    
    return (
      <div className="lessons-page">
        <div className="success-message">
          <h2>Dziękujemy za subskrypcję!</h2>
          <p>Twoja subskrypcja została pomyślnie aktywowana.</p>
          <button onClick={handleGoToLessons} className="lesson-link">Przejdź do lekcji</button>
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
            {lessons.map(lesson => (
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
          
          <button 
            className="subscribe-button" 
            onClick={handleSubscribe}
            disabled={redirectLoading}
          >
            {redirectLoading 
              ? 'Przekierowywanie...' 
              : isLoggedIn ? 'Subskrybuj Teraz' : 'Zaloguj się, aby Subskrybować'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonsPage;