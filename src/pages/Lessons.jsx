import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/subscription.css';

// Create a proper auth hook that uses the API
const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (!token || !userData) {
          setIsLoggedIn(false);
          setIsSubscribed(false);
          setIsLoading(false);
          return;
        }
        
        setIsLoggedIn(true);
        
        // Parse user data to check if isSubscribed flag exists
        const user = JSON.parse(userData);
        if (user.isSubscribed !== undefined) {
          setIsSubscribed(user.isSubscribed);
          setIsLoading(false);
          return;
        }
        
        // If not in user data, check API
        const response = await fetch('/api/subscription/subscription-status', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsSubscribed(data.isSubscribed);
          
          // Update local user data with subscription status
          if (userData) {
            const updatedUser = { ...user, isSubscribed: data.isSubscribed };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            // Dispatch custom event to notify Header component
            window.dispatchEvent(new Event('authChange'));
          }
        } else {
          console.error('Błąd podczas sprawdzania statusu subskrypcji');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Błąd podczas sprawdzania statusu autoryzacji:', error);
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  return { isLoggedIn, isSubscribed, isLoading };
};

const Lessons = () => {
  const { isLoggedIn, isSubscribed, isLoading } = useAuth();
  const [redirectLoading, setRedirectLoading] = useState(false);
  
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
        <div className="lessons-container">
          <div className="lesson-section">
            <h2>Lekcje dla Początkujących</h2>
            <ul className="lesson-list">
              <li className="lesson-item">
                <h3>Wprowadzenie do Podstaw</h3>
                <p>Poznaj podstawowe koncepcje i słownictwo</p>
                <a href="#lesson-1" className="lesson-link">Rozpocznij Lekcję</a>
              </li>
              <li className="lesson-item">
                <h3>Podstawowe Zwroty</h3>
                <p>Opanuj codzienne wyrażenia i powitania</p>
                <a href="#lesson-2" className="lesson-link">Rozpocznij Lekcję</a>
              </li>
            </ul>
          </div>
          
          <div className="lesson-section">
            <h2>Lekcje Średniozaawansowane</h2>
            <ul className="lesson-list">
              <li className="lesson-item">
                <h3>Umiejętności Konwersacji</h3>
                <p>Rozwiń płynność w typowych sytuacjach</p>
                <a href="#lesson-3" className="lesson-link">Rozpocznij Lekcję</a>
              </li>
              <li className="lesson-item">
                <h3>Struktury Gramatyczne</h3>
                <p>Buduj złożone zdania z pewnością siebie</p>
                <a href="#lesson-4" className="lesson-link">Rozpocznij Lekcję</a>
              </li>
            </ul>
          </div>
          
          <div className="lesson-section">
            <h2>Lekcje Zaawansowane</h2>
            <ul className="lesson-list">
              <li className="lesson-item">
                <h3>Wgląd w Kulturę</h3>
                <p>Zrozum język w kontekście kulturowym</p>
                <a href="#lesson-5" className="lesson-link">Rozpocznij Lekcję</a>
              </li>
              <li className="lesson-item">
                <h3>Zaawansowane Tematy</h3>
                <p>Opanuj złożone struktury językowe</p>
                <a href="#lesson-6" className="lesson-link">Rozpocznij Lekcję</a>
              </li>
            </ul>
          </div>
        </div>
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

export default Lessons;