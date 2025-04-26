import React, { useState } from 'react';
import { Form, Link } from 'react-router-dom';
import authService from '../../services/authService';
import './ForgotPassword.scss';

function ForgotPassword() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;

    try {
      const response = await authService.forgotPassword(email);
      setSuccess(response.message);
      // Clear the form
      (event.target as HTMLFormElement).reset();
    } catch (err: any) {
      setError(err.message || 'Wystąpił błąd podczas przetwarzania żądania.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <Form onSubmit={handleSubmit} className="forgot-password-form">
        <h1>Resetowanie hasła</h1>
        <p>Podaj swój adres email, aby otrzymać instrukcje dotyczące resetowania hasła.</p>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <div className="form-group">
          <label htmlFor="email">Adres email:</label>
          <input type="email" id="email" name="email" required />
        </div>
        
        <button type="submit" className="submit-button" disabled={isSubmitting}>
          {isSubmitting ? 'Przetwarzanie...' : 'Wyślij link resetujący'}
        </button>
        
        <div className="back-to-login">
          <Link to="/logowanie">Powrót do logowania</Link>
        </div>
      </Form>
    </div>
  );
}

export default ForgotPassword; 