import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyPaymentStatus } from '../services/stripeService';
import './PaymentSuccess.scss';

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState({
    status: 'processing',
    success: false,
    message: 'Weryfikacja płatności...'
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
            message: 'Brak informacji o płatności'
          });
          setLoading(false);
          return;
        }
        
        // Verify payment status using either payment_intent or session_id
        const status = await verifyPaymentStatus(paymentIntentId || sessionId);
        setPaymentStatus(status);
      } catch (error) {
        console.error('Błąd weryfikacji płatności:', error);
        setPaymentStatus({
          status: 'error',
          success: false,
          message: 'Wystąpił błąd podczas weryfikacji płatności'
        });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, []);

  useEffect(() => {
    if (paymentStatus.success) {
      window.dispatchEvent(new Event('authChange'));
    }
  }, [paymentStatus.success]);

  return (
    <div className="payment-success">
      <div className="payment-success__container">
        <h1 className="payment-success__title">
          {paymentStatus.success 
            ? 'Dziękujemy za zakup!' 
            : 'Status płatności'}
        </h1>
        
        {loading ? (
          <div className="payment-success__loading">
            <p>Weryfikacja płatności...</p>
          </div>
        ) : (
          <>
            <div className="payment-success__status">
              <p className={`payment-success__message ${paymentStatus.success ? 'success' : 'processing'}`}>
                {paymentStatus.message}
              </p>
              
              {paymentStatus.success && (
                <div className="payment-success__details">
                  <p>Twoje zamówienie zostało zrealizowane. Na Twój adres email wysłaliśmy potwierdzenie zakupu wraz z instrukcją pobierania ebooka.</p>
                </div>
              )}
            </div>
            
            <div className="payment-success__actions">
              {paymentStatus.success ? (
                <Link to="/biblioteka" className="payment-success__button">
                  Przejdź do biblioteki
                </Link>
              ) : (
                <Link to="/ebooki" className="payment-success__button">
                  Wróć do ebooków
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PaymentSuccess; 