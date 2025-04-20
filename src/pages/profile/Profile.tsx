import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../../styles/profile.scss';
import apiClient from '../../services/apiClient';
import { fetchUserProfile } from '../../services/userService';
import { User } from '../../types/user.types';

function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const userDataString = localStorage.getItem('user');

      if (!token || !userDataString) {
        navigate('/logowanie');
        return;
      }

      let parsedUserData: User;
      try {
        parsedUserData = JSON.parse(userDataString);
        setUser(parsedUserData); // Set initial user data from local storage
      } catch (e) {
        console.error('Failed to parse user data from localStorage', e);
        setError('Wystąpił błąd podczas odczytu danych lokalnych.');
        localStorage.removeItem('token'); // Clear potentially corrupted data
        localStorage.removeItem('user');
        navigate('/logowanie');
        return;
      }

      // Fetch fresh user data from the server
      if (parsedUserData?.email) {
        try {
          // Fetch fresh user data using the userService
          const frontendUserData = await fetchUserProfile(parsedUserData.email);
          setUser(frontendUserData);
          localStorage.setItem('user', JSON.stringify(frontendUserData));
          console.log('freshUserData fetched via service', frontendUserData);
        } catch (err) {
          console.error('Błąd podczas pobierania danych użytkownika:', err);
          // Keep local storage data but show an error
          setError(
            'Nie udało się zaktualizować danych profilu. Wyświetlane dane mogą być nieaktualne.'
          );
        } finally {
          setLoading(false);
        }
      } else {
        // If no email in parsed data, cannot fetch fresh data
        setError('Brak adresu email w danych lokalnych, nie można zaktualizować profilu.');
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
      setError(null); // Clear previous errors
      const data = await apiClient.post('/api/subscription/create-portal-session', {});
      const responseData = data as { url?: string };

      if (responseData.url) {
        window.location.href = responseData.url;
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

      {user ? (
        <>
          <div className="profile-details">
            <div className="profile-field">
              <label>Imię:</label>
              <p>{user.name || 'Nie podano'}</p>
            </div>

            <div className="profile-field">
              <label>Email:</label>
              <p>{user.email || 'Nie podano'}</p>
            </div>

            <div className="profile-field">
              <label>Status subskrypcji:</label>
              <p>
                {user.subscriptionStatus === 'active' ? 'Aktywna' : 'Brak aktywnej subskrypcji'}
              </p>
            </div>

            {user.isAdmin && (
              <div className="profile-field">
                <label>Status:</label>
                <p>Administrator</p>
              </div>
            )}
          </div>

          <div className="profile-actions">
            {user.subscriptionStatus === 'active' && (
              <button
                className="manage-subscription-button"
                onClick={handleManageSubscription}
                disabled={portalLoading}
              >
                {portalLoading ? 'Ładowanie...' : 'Zarządzaj subskrypcją'}
              </button>
            )}

            <button className="logout-button" onClick={handleLogout}>
              Wyloguj
            </button>
          </div>
        </>
      ) : (
        // This should ideally not happen if loading is false and no error occurred,
        // but added as a fallback.
        <p>Nie udało się załadować danych profilu.</p>
      )}
    </div>
  );
}

export default Profile;
