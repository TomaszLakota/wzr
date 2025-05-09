import React, { useState, FormEvent } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { createSubscription } from '../../services/stripeService'; // Import the service function

export interface SubscriptionButtonProps {
  priceId: string;
  productName: string;
}

const SubscriptionButton: React.FC<SubscriptionButtonProps> = ({ priceId, productName }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState<boolean>(false);
  const [showPaymentForm, setShowPaymentForm] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubscribe = async (event: FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded
      console.error('Stripe.js has not loaded yet.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      // Call the service function to create the subscription
      const { clientSecret } = await createSubscription(priceId);

      // We need the client secret from the backend response to confirm the payment
      if (!clientSecret) {
        setErrorMessage('Client secret not received from backend.');
        setLoading(false);
        return;
      }

      // Confirm the subscription setup using the client secret
      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret, // Use the client secret from the backend
        confirmParams: {
          return_url: `${window.location.origin}/subscription-success`,
          // Payment method data might not be needed if using PaymentElement
          // payment_method_data: {
          //   billing_details: {
          //     name: 'Jenny Rosen', // This should come from your form/user data
          //   },
          // },
        },
      });

      if (error) {
        setErrorMessage(error.message ?? 'An unknown payment confirmation error occurred.');
      }
      // If confirmPayment is successful, Stripe automatically redirects
      // to the return_url. If there is an error, it stays on the page.
    } catch (err: any) {
      // Catch specific error types if needed
      setErrorMessage(err.message || 'An unexpected error occurred during subscription setup.');
      console.error('Subscription setup error:', err);
    }

    setLoading(false); // Only set loading false if an error occurs before redirect
  };

  return (
    <div className="subscription-container">
      {!showPaymentForm ? (
        <button className="subscribe-button" onClick={() => setShowPaymentForm(true)}>
          Subskrybuj {productName}
        </button>
      ) : (
        <form onSubmit={handleSubscribe}>
          <h3>Subskrybuj {productName}</h3>
          <PaymentElement />
          {errorMessage && <div className="error-message">{errorMessage}</div>}
          <button type="submit" disabled={!stripe || loading} className="payment-button">
            {loading ? 'Przetwarzanie...' : 'Subskrybuj teraz'}
          </button>
        </form>
      )}
    </div>
  );
};

export default SubscriptionButton;
