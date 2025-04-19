import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyPaymentStatus } from '../../services/stripeService';
import './PaymentSuccess.scss';

interface PaymentStatus {
  status: 'processing' | 'success' | 'error';
  success: boolean;
  message: string;
}

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
    status: 'processing',
    success: false,
    message: 'Weryfikacja płatności...',
  });
  const [loading, setLoading] = useState(true);
  const [verificationAttempted, setVerificationAttempted] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      if (verificationAttempted) return;

      try {
        setVerificationAttempted(true);
        // Get payment_intent or session_id from URL query params
        const paymentIntentId = searchParams.get('payment_intent');
        const sessionId = searchParams.get('session_id');

        if (!paymentIntentId && !sessionId) {
          setPaymentStatus({
            status: 'error',
            success: false,
            message: 'Brak informacji o płatności',
          });
          setLoading(false);
          return;
        }

        // Verify payment status using either payment_intent or session_id
        const identifier = paymentIntentId || sessionId;
        if (identifier) {
          const status = await verifyPaymentStatus(identifier);
          setPaymentStatus(status);
        } else {
          // This case should technically not be reached due to the check above,
          // but adding it for completeness and type safety.
          setPaymentStatus({
            status: 'error',
            success: false,
            message: 'Brak identyfikatora płatności',
          });
        }
      } catch (error) {
        console.error('Błąd weryfikacji płatności:', error);
        setPaymentStatus({
          status: 'error',
          success: false,
          message: 'Wystąpił błąd podczas weryfikacji płatności',
        });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, verificationAttempted]); // Added dependencies

  useEffect(() => {
    // Potentially update user state/local storage if payment was successful
    if (paymentStatus.success) {
      console.log('Payment successful, potentially update user state here.');
      // Example: Trigger an event or fetch updated user data
      window.dispatchEvent(new Event('paymentSuccess'));
    }
  }, [paymentStatus.success]);

  return (
    <div className="payment-success">
      <div className="payment-success__container">
        <h1 className="payment-success__title">
          {paymentStatus.status === 'success'
            ? 'Dziękujemy za zakup!'
            : paymentStatus.status === 'error'
              ? 'Błąd Płatności'
              : 'Status płatności'}
        </h1>

        {loading ? (
          <div className="payment-success__loading">
            <p>Weryfikacja płatności...</p>
          </div>
        ) : (
          <>
            <div className="payment-success__status">
              <p className={`payment-success__message ${paymentStatus.status}`}>
                {paymentStatus.message}
              </p>

              {paymentStatus.success && (
                <div className="payment-success__details">
                  <p>
                    Twoje zamówienie zostało zrealizowane. Na Twój adres email wysłaliśmy
                    potwierdzenie zakupu wraz z instrukcją pobierania ebooka.
                  </p>
                </div>
              )}
            </div>

            <div className="payment-success__actions">
              {paymentStatus.success ? (
                <Link to="/biblioteka" className="payment-success__button primary">
                  Przejdź do biblioteki
                </Link>
              ) : (
                <Link to="/ebooki" className="payment-success__button secondary">
                  Wróć do ebooków
                </Link>
              )}
              {/* Optionally add a button to retry or contact support on error */}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PaymentSuccess;
