import React, { useState, useEffect } from 'react';
import { Form, Link, useSearchParams, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import './ResetPassword.scss';

function ResetPassword() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    // Get token from URL
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError('Brak tokena resetującego hasło w adresie URL.');
    }
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Basic validation
    if (password !== confirmPassword) {
      setError('Hasła nie są identyczne.');
      setIsSubmitting(false);
      return;
    }

    if (password.length < 8) {
      setError('Hasło musi mieć co najmniej 8 znaków.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await authService.resetPassword(token, password);
      setSuccess(response.message);
      
      // Redirect to login page after successful password reset
      setTimeout(() => {
        navigate('/logowanie');
      }, 5000);
    } catch (err: any) {
      setError(err.message || 'Wystąpił błąd podczas resetowania hasła.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reset-password-container">
      <Form onSubmit={handleSubmit} className="reset-password-form">
        <h1>Ustaw nowe hasło</h1>
        <p>Wprowadź nowe hasło dla swojego konta.</p>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <div className="form-group">
          <label htmlFor="password">Nowe hasło:</label>
          <input 
            type="password" 
            id="password" 
            name="password" 
            required 
            disabled={!token || isSubmitting}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">Potwierdź hasło:</label>
          <input 
            type="password" 
            id="confirmPassword" 
            name="confirmPassword" 
            required 
            disabled={!token || isSubmitting}
          />
        </div>
        
        <button 
          type="submit" 
          className="submit-button" 
          disabled={!token || isSubmitting}
        >
          {isSubmitting ? 'Przetwarzanie...' : 'Resetuj hasło'}
        </button>
        
        <div className="back-to-login">
          <Link to="/logowanie">Powrót do logowania</Link>
        </div>
      </Form>
    </div>
  );
}

export default ResetPassword; 