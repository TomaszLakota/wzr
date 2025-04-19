import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

const SubscriptionButton = ({ priceId, productName }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubscribe = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded
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
          priceId: priceId,
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
          return_url: `${window.location.origin}/subscription-success`,
          payment_method_data: {
            billing_details: {
              name: 'Jenny Rosen', // This should come from your form
            },
          },
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
    <div className="subscription-container">
      {!showPaymentForm ? (
        <button 
          className="subscribe-button" 
          onClick={() => setShowPaymentForm(true)}
        >
          Subscribe to {productName}
        </button>
      ) : (
        <form onSubmit={handleSubscribe}>
          <h3>Subscribe to {productName}</h3>
          <PaymentElement />
          {errorMessage && <div className="error-message">{errorMessage}</div>}
          <button 
            type="submit" 
            disabled={!stripe || loading} 
            className="payment-button"
          >
            {loading ? 'Processing...' : 'Subscribe Now'}
          </button>
        </form>
      )}
    </div>
  );
};

export default SubscriptionButton; 