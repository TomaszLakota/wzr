import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './EmailActivated.scss';
import { activateUserAccount } from '../../services/userService';

const EmailActivated: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Aktywowanie konta...');

  useEffect(() => {
    const activate = async () => {
      const token = searchParams.get('token');
      if (!token) {
        setMessage('Brak tokena aktywacyjnego w linku.');
        setStatus('error');
        return;
      }

      try {
        const response = await activateUserAccount(token);

        setMessage(response.message || 'Konto pomyślnie aktywowane! Możesz się teraz zalogować.');
        setStatus('success');
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Wystąpił błąd podczas aktywacji konta.';
        setMessage(errorMessage);
        setStatus('error');
        console.error('Activation error:', error.response?.data || error);
      }
    };

    activate();
  }, [searchParams]);

  return (
    <div className="email-activated-page">
      <div className="activation-card">
        {status === 'loading' && (
          <>
            <h1>Aktywowanie...</h1>
            <p>{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <h1>Konto Aktywowane!</h1>
            <p>{message}</p>
            <Link to="/logowanie" className="button primary">
              Zaloguj się
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <h1>Błąd Aktywacji</h1>
            <p>{message}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailActivated;
