import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import '../styles/adminPanel.scss';

// Helper function to format subscription status in Polish
const formatStatus = (status, cancelAt) => {
  const statusMap = {
    active: cancelAt ? 'Aktywna do' : 'Aktywna',
    canceled: 'Anulowana',
    incomplete: 'Niekompletna',
    incomplete_expired: 'Wygasła',
    past_due: 'Zaległa',
    trialing: 'Okres próbny',
    unpaid: 'Nieopłacona',
    error: 'Błąd',
    unknown: 'Nieznany',
  };
  return statusMap[status] || status;
};

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [managingUser, setManagingUser] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const navigate = useNavigate();

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const data = await apiClient.get(
        `/api/admin/users/subscriptions?page=${page}&limit=${pagination.limit}`
      );

      setUsers(data.users);
      setPagination((prev) => ({
        ...prev,
        page: data.pagination.page,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
      }));
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async (email) => {
    try {
      setManagingUser(email);
      const data = await apiClient.post(`/api/admin/users/${email}/portal`);

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Nie udało się utworzyć sesji zarządzania');
      }
    } catch (err) {
      console.error('Error managing subscription:', err);
      setError(err.message);
    } finally {
      setManagingUser(null);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [navigate]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchUsers(newPage);
    }
  };

  if (loading && !users.length) {
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
              <th>Plan</th>
              <th>Status subskrypcji</th>
              <th>Data rozp.</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.email}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.subscriptionPlan}</td>
                <td
                  className={`status-${user.subscriptionStatus}${user.cancelAt ? ' status-canceling' : ''}`}
                >
                  {formatStatus(user.subscriptionStatus, user.cancelAt)}
                  {user.cancelAt && (
                    <span className="cancel-date">
                      {new Date(user.cancelAt).toLocaleDateString('pl-PL')}
                    </span>
                  )}
                </td>
                <td>
                  {user.subscriptionStartDate
                    ? new Date(user.subscriptionStartDate).toLocaleDateString('pl-PL')
                    : '-'}
                </td>
                <td>
                  <button
                    className="manage-button"
                    onClick={() => handleManageSubscription(user.email)}
                    disabled={managingUser === user.email}
                  >
                    {managingUser === user.email ? 'Ładowanie...' : 'Zarządzaj'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {pagination.totalPages >= 1 && (
          <div className="pagination">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || loading}
            >
              Poprzednia
            </button>
            <span className="page-info">
              Strona {pagination.page} z {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages || loading}
            >
              Następna
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
