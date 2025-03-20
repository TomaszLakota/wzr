import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import '../styles/subscription.css';

const SubscriptionPromo = ({ isLoggedIn }) => {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const subscriptionDetails = {
    name: 'Dostęp do Lekcji Premium',
    price: '90zł miesięcznie',
    description: 'Odblokuj wszystkie lekcje premium i ucz się we własnym tempie',
    features: [
      'Dostęp do wszystkich lekcji',
      'Cotygodniowe aktualizacje treści'
    ]
  };

  const handleSubscribe = async (event) => {
    event.preventDefault();

    if (!isLoggedIn) {
      navigate('/logowanie?redirect=lekcje');
      return;
    }

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      // Call your backend to create the subscription
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: 'price_premium_monthly', // Your single subscription price ID
        }),
      });

      const data = await response.json();

      if (data.error) {
        setErrorMessage(data.error.message);
        setLoading(false);
        return;
      }

      // Confirm the subscription setup
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/lekcje`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred.');
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div className="subscription-promo">
      <div className="promo-content">
        <h2>Odblokuj Lekcje Premium</h2>
        <p className="promo-description">
          Podnieś swój poziom nauki dzięki naszej subskrypcji lekcji.
        </p>
        
        <div className="subscription-card">
          <h3>{subscriptionDetails.name}</h3>
          <p className="price">{subscriptionDetails.price}</p>
          <p>{subscriptionDetails.description}</p>
          
          <ul className="feature-list">
            {subscriptionDetails.features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>

          {!showPaymentForm ? (
            <button 
              className="subscribe-button" 
              onClick={() => isLoggedIn ? setShowPaymentForm(true) : navigate('/logowanie?redirect=lekcje')}
            >
              {isLoggedIn ? 'Subskrybuj Teraz' : 'Zaloguj się, aby Subskrybować'}
            </button>
          ) : (
            <form onSubmit={handleSubscribe} className="payment-form">
              <PaymentElement />
              {errorMessage && <div className="error-message">{errorMessage}</div>}
              <button 
                type="submit" 
                disabled={!stripe || loading} 
                className="payment-button"
              >
                {loading ? 'Przetwarzanie...' : 'Subskrybuj'}
              </button>
              <button 
                type="button"
                onClick={() => setShowPaymentForm(false)}
                className="cancel-button"
              >
                Anuluj
              </button>
            </form>
          )}
        </div>

       
      </div>
    </div>
  );
};

export default SubscriptionPromo; 