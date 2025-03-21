import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/profile.css';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portalUrl, setPortalUrl] = useState('');
  const [portalLoading, setPortalLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (!token || !userData) {
        navigate('/logowanie');
        return;
      }
      
      setUser(JSON.parse(userData));
      setLoading(false);
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
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/subscription/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      const data = await response.json();
      
      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert('Nie udało się utworzyć sesji zarządzania subskrypcją.');
      }
    } catch (error) {
      console.error('Błąd podczas tworzenia sesji zarządzania subskrypcją:', error);
      alert('Wystąpił błąd podczas próby zarządzania subskrypcją.');
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