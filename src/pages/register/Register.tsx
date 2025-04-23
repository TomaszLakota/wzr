import React, { useState } from 'react';
import { Form, useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import './Register.scss';

function Register() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const userData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      name: formData.get('name') as string,
    };

    if (!userData.email || !userData.password || !userData.name) {
      setError('Wszystkie pola są wymagane.');
      return;
    }
    if (userData.password.length < 8) {
      setError('Hasło musi mieć co najmniej 8 znaków.');
      return;
    }

    try {
      await apiClient.post('/api/register', userData);
      navigate('/rejestracja-sukces');
    } catch (err: any) {
      setError(err.message || 'Błąd podczas rejestracji. Spróbuj ponownie.');
    }
  };

  return (
    <div className="register-container">
      <h1>Rejestracja</h1>
      {error && <div className="error-message">{error}</div>}
      <Form onSubmit={handleSubmit} className="register-form">
        <div className="form-group">
          <label htmlFor="name">Imię i nazwisko:</label>
          <input type="text" id="name" name="name" required minLength={2} />
        </div>

        <div className="form-group">
          <label htmlFor="email">Adres e-mail:</label>
          <input type="email" id="email" name="email" required />
        </div>

        <div className="form-group">
          <label htmlFor="password">Hasło:</label>
          <input type="password" id="password" name="password" required minLength={8} />
        </div>

        <button type="submit" className="submit-button">
          Zarejestruj się
        </button>
      </Form>
    </div>
  );
}

export default Register;
