import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Subscription.scss';
import { createSubscriptionCheckoutSession } from '../../services/stripeService';

export interface SubscriptionPromoProps {
  isLoggedIn: boolean;
}

const SubscriptionPromo: React.FC<SubscriptionPromoProps> = ({ isLoggedIn }) => {
  const [redirectLoading, setRedirectLoading] = useState(false);
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

  const handleSubscribe = async () => {
    if (!isLoggedIn) {
      navigate('/logowanie?redirect=lekcje');
      return;
    }

    setRedirectLoading(true);

    try {
      const priceId = import.meta.env.VITE_STRIPE_SUBSCRIPTION_PRICE_ID;
      if (!priceId) {
        throw new Error('Stripe Price ID nie jest skonfigurowany.');
      }
      const successUrl = `${window.location.origin}/lekcje?success=true`;
      const cancelUrl = `${window.location.origin}/lekcje?canceled=true`;

      const checkoutResponse = await createSubscriptionCheckoutSession(
        priceId,
        successUrl,
        cancelUrl
      );

      if (checkoutResponse.success && checkoutResponse.sessionUrl) {
        window.location.href = checkoutResponse.sessionUrl;
      } else {
        alert(
          checkoutResponse.message ||
            'Nie udało się utworzyć sesji płatności. Prosimy spróbować ponownie.'
        );
        setRedirectLoading(false);
      }
    } catch (error) {
      console.error('Błąd podczas tworzenia sesji płatności:', error);
      alert(error instanceof Error ? error.message : 'Wystąpił błąd. Prosimy spróbować ponownie.');
      setRedirectLoading(false);
    }
  };

  return (
    <div className="subscription-promo">
      <div className="promo-content">
        <h2>Odblokuj Lekcje</h2>
        <p className="promo-description">{subscriptionDetails.description}</p>

        <div className="subscription-card">
          <h3>{subscriptionDetails.name}</h3>
          <p className="price">{subscriptionDetails.price}</p>
          <p>{subscriptionDetails.description}</p>

          <ul className="feature-list">
            {subscriptionDetails.features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
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

export default SubscriptionPromo;
