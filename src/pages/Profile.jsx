import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/profile.css';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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
    navigate('/');
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
      </div>
      
      <div className="profile-actions">
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