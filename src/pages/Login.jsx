import { Form, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import apiClient from '../services/apiClient';
import './Login.scss';

function Login() {
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const userData = {
      email: formData.get('email'),
      password: formData.get('password'),
    };

    try {
      const data = await apiClient.post('/api/login', userData);
      
      // Store the token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Dispatch custom event to notify Header component
      window.dispatchEvent(new Event('authChange'));

      // Redirect to home page or dashboard
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <Form onSubmit={handleSubmit} className="login-form">
        <h1>Logowanie</h1>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label htmlFor="email">Adres email:</label>
          <input type="email" id="email" name="email" required />
        </div>
        <div className="form-group">
          <label htmlFor="password">Hasło:</label>
          <input type="password" id="password" name="password" required />
        </div>
        <button type="submit" className="submit-button">
          Logowanie
        </button>
      </Form>
    </div>
  );
}

export default Login;
