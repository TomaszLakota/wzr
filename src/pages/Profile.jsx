import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/profile.scss';
import apiClient from '../services/apiClient';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portalUrl, setPortalUrl] = useState('');
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (!token || !userData) {
        navigate('/logowanie');
        return;
      }
      
      // Parse the local user data
      const parsedUserData = JSON.parse(userData);
      setUser(parsedUserData);
      
      try {
        // Fetch fresh user data from the server
        const freshUserData = await apiClient.get(`/api/users/${parsedUserData.email}`);
        setUser(freshUserData);
        
        // Update local storage with fresh data
        localStorage.setItem('user', JSON.stringify(freshUserData));
      } catch (err) {
        console.error('Błąd podczas pobierania danych użytkownika:', err);
        setError('Wystąpił błąd podczas ładowania danych. Spróbuj ponownie później.');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Dispatch custom event to notify Header component
    window.dispatchEvent(new Event('authChange'));
    
    navigate('/');
  };

  const handleManageSubscription = async () => {
    try {
      setPortalLoading(true);
      const data = await apiClient.post('/api/subscription/create-portal-session');
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Nie udało się utworzyć sesji zarządzania subskrypcją.');
      }
    } catch (error) {
      console.error('Błąd podczas tworzenia sesji zarządzania subskrypcją:', error);
      setError('Wystąpił błąd podczas próby zarządzania subskrypcją.');
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return <div className="profile-container">Ładowanie...</div>;
  }

  return (
    <div className="profile-container">
      <h1>Twój profil</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="profile-details">
        <div className="profile-field">
          <label>Imię:</label>
          <p>{user?.name || 'Nie podano'}</p>
        </div>
        
        <div className="profile-field">
          <label>Email:</label>
          <p>{user?.email || 'Nie podano'}</p>
        </div>

        <div className="profile-field">
          <label>Status subskrypcji:</label>
          <p>{user?.isSubscribed ? 'Aktywna' : 'Brak aktywnej subskrypcji'}</p>
        </div>

        {user?.isAdmin && (
          <div className="profile-field">
            <label>Status:</label>
            <p>Administrator</p>
          </div>
        )}
      </div>
      
      <div className="profile-actions">
        {user?.isSubscribed && (
          <button 
            className="manage-subscription-button" 
            onClick={handleManageSubscription}
            disabled={portalLoading}
          >
            {portalLoading ? 'Ładowanie...' : 'Zarządzaj subskrypcją'}
          </button>
        )}
        
        <button 
          className="logout-button" 
          onClick={handleLogout}
        >
          Wyloguj
        </button>
      </div>
    </div>
  );
}

export default Profile; 