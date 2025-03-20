import React, { useState, useEffect } from 'react';
import SubscriptionPromo from '../components/SubscriptionPromo';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import '../styles/subscription.css';

// Assuming you'll have this from your auth system
const useAuth = () => {
  // This is a placeholder - replace with your actual auth logic
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // TODO: Implement actual API call
        // const response = await fetch('/api/auth/status');
        // const data = await response.json();
        // setIsLoggedIn(data.isLoggedIn);
        // setIsSubscribed(data.isSubscribed);
        
        // Tymczasowa implementacja
        setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
        setIsSubscribed(localStorage.getItem('isSubscribed') === 'true');
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

const stripePromise = loadStripe(import.meta.env.STRIPE_PUBLISHABLE_KEY);

const Lessons = () => {
  const { isLoggedIn, isSubscribed, isLoading } = useAuth();
  const [clientSecret, setClientSecret] = useState('');
  
  useEffect(() => {
    // Only fetch client secret if user is logged in but not subscribed
    if (isLoggedIn && !isSubscribed && !isLoading) {
      const getClientSecret = async () => {
        try {
          // TODO: Implement actual API call
          // const response = await fetch('/api/setup-subscription-intent');
          // const data = await response.json();
          // setClientSecret(data.clientSecret);
        } catch (error) {
          console.error('Błąd podczas pobierania klucza klienta:', error);
        }
      };
      
      getClientSecret();
    }
  }, [isLoggedIn, isSubscribed, isLoading]);

  if (isLoading) {
    return <div className="loading">Ładowanie...</div>;
  }

  // Show lessons content if user is logged in and subscribed
  if (isLoggedIn && isSubscribed) {
    return (
      <div className="lessons-page">
        <h1>Lekcje Premium</h1>
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

  // Show promo if user is not logged in or not subscribed
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <SubscriptionPromo isLoggedIn={isLoggedIn} />
    </Elements>
  );
};

export default Lessons;