import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/adminPanel.scss';

// Helper function to format subscription status in Polish
const formatStatus = (status) => {
  const statusMap = {
    'active': 'Aktywna',
    'canceled': 'Anulowana',
    'incomplete': 'Niekompletna',
    'incomplete_expired': 'Wygasła',
    'past_due': 'Zaległa',
    'trialing': 'Okres próbny',
    'unpaid': 'Nieopłacona',
    'error': 'Błąd',
    'unknown': 'Nieznany'
  };
  return statusMap[status] || status;
};

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/logowanie');
          return;
        }

        const response = await fetch('/api/admin/users/subscriptions', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 403) {
          navigate('/');
          return;
        }

        if (!response.ok) {
          throw new Error('Nie udało się pobrać danych użytkowników');
        }

        const data = await response.json();
        setUsers(data);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [navigate]);

  if (loading) {
    return <div className="admin-panel">Ładowanie...</div>;
  }

  return (
    <div className="admin-panel">
      <h1>Panel Administratora</h1>
      <h2>Użytkownicy z Subskrypcjami</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Imię</th>
              <th>Email</th>
              <th>Data utworzenia konta</th>
              <th>Plan</th>
              <th>Status subskrypcji</th>
              <th>Data rozpoczęcia</th>
              <th>ID klienta Stripe</th>
              <th>ID subskrypcji</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.email}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{new Date(user.createdAt).toLocaleDateString('pl-PL')}</td>
                <td>{user.subscriptionPlan}</td>
                <td className={`status-${user.subscriptionStatus}`}>
                  {formatStatus(user.subscriptionStatus)}
                </td>
                <td>
                  {user.subscriptionStartDate 
                    ? new Date(user.subscriptionStartDate).toLocaleDateString('pl-PL')
                    : '-'}
                </td>
                <td>{user.stripeCustomerId}</td>
                <td>{user.stripeSubscriptionId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminPanel; 