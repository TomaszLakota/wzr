import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import '../styles/subscription.scss';
import { StripeCardElement } from '@stripe/stripe-js';

interface SubscriptionPromoProps {
  isLoggedIn: boolean;
}

// Extend Window interface to include clientSecret
declare global {
  interface Window {
    clientSecret?: string;
  }
}

const SubscriptionPromo: React.FC<SubscriptionPromoProps> = ({ isLoggedIn }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const navigate = useNavigate();

  const subscriptionDetails = {
    name: 'Dostęp do Lekcji',
    price: '90zł miesięcznie',
    description: 'Podnieś swój poziom nauki dzięki naszej subskrypcji lekcji',
    features: [
      'Dostęp do wszystkich lekcji',
      'Cotygodniowe aktualizacje treści',
      'Materiały dodatkowe do pobrania',
      'Anuluj w dowolnym momencie',
    ],
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !window.clientSecret) {
      // Ensure clientSecret exists
      console.error('Stripe, Elements, or clientSecret not available');
      setError('Błąd konfiguracji płatności. Skontaktuj się z administratorem.');
      return;
    }

    setProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement) as StripeCardElement | null;

      if (!cardElement) {
        setError('Nie można znaleźć elementu karty.');
        setProcessing(false);
        return;
      }

      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (paymentMethodError) {
        setError(
          paymentMethodError.message ?? 'Wystąpił nieznany błąd przy tworzeniu metody płatności.'
        );
        setProcessing(false);
        return;
      }

      // Use the client secret from the window object to confirm the payment
      const { error: confirmError } = await stripe.confirmCardPayment(window.clientSecret, {
        payment_method: paymentMethod.id,
      });

      if (confirmError) {
        setError(confirmError.message ?? 'Wystąpił nieznany błąd przy potwierdzaniu płatności.');
        setProcessing(false);
        return;
      }

      // If we get here, payment succeeded!
      setSuccess(true);
      setError(null);

      // Update local storage to reflect subscription
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          // Ensure user object and isSubscribed property exist before modification
          if (typeof user === 'object' && user !== null) {
            user.isSubscribed = true;
            localStorage.setItem('user', JSON.stringify(user));

            // Dispatch custom event to notify Header component
            window.dispatchEvent(new Event('authChange'));
          } else {
            console.error('Invalid user data found in local storage');
          }
        } catch (parseError) {
          console.error('Error parsing user data from local storage:', parseError);
        }
      }

      // Redirect to lessons page
      setTimeout(() => {
        window.location.href = '/lekcje';
      }, 2000);
    } catch (err) {
      console.error('Błąd podczas przetwarzania płatności:', err);
      setError('Wystąpił błąd podczas przetwarzania płatności. Prosimy spróbować ponownie.');
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="subscription-promo">
        <div className="success-message">
          <h2>Płatność Zaakceptowana!</h2>
          <p>Dziękujemy za subskrypcję! Przekierowujemy Cię do lekcji...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-promo">
      <div className="promo-content">
        <h2>Odblokuj Lekcje</h2>
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

          {isLoggedIn ? (
            <form className="payment-form" onSubmit={handleSubmit}>
              <div className="card-element-container">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                      invalid: {
                        color: '#9e2146',
                      },
                    },
                  }}
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" disabled={!stripe || processing} className="payment-button">
                {processing ? 'Przetwarzanie...' : 'Subskrybuj'}
              </button>
            </form>
          ) : (
            <button
              className="subscribe-button"
              onClick={() => navigate('/logowanie?redirect=lekcje')}
            >
              Zaloguj się, aby Subskrybować
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPromo;
