import { Form } from 'react-router-dom';
import { useState } from 'react';
import './Register.scss';

function Register() {
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const userData = {
      email: formData.get('email'),
      password: formData.get('password'),
      name: formData.get('name'),
    };

    try {
      const response = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Błąd podczas rejestracji');
      }

      // Redirect to login page on success
      window.location.href = '/logowanie';
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="register-container">
      <h1>Rejestracja</h1>
      {error && <div className="error-message">{error}</div>}
      <Form method="post" className="register-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Imię i nazwisko:</label>
          <input type="text" id="name" name="name" required minLength="2" />
        </div>

        <div className="form-group">
          <label htmlFor="email">Adres e-mail:</label>
          <input type="email" id="email" name="email" required />
        </div>

        <div className="form-group">
          <label htmlFor="password">Hasło:</label>
          <input type="password" id="password" name="password" required minLength="8" />
        </div>

        <button type="submit" className="submit-button">
          Zarejestruj się
        </button>
      </Form>
    </div>
  );
}

export default Register;
