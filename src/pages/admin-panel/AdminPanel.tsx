import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/adminPanel.scss';
import apiClient from '../../services/apiClient';
import { fetchAdminUsers } from '../../services/userService';
import { User } from '../../types/user.types';
import { Pagination } from '../../types/shared.types';

function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [managingUser, setManagingUser] = useState<string | null>(null); // Email or null
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const navigate = useNavigate();

  const fetchUsers = async (page: number = 1) => {
    try {
      setLoading(true);
      const data = await fetchAdminUsers(page, pagination.limit);

      console.log('data', data.users);
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err: unknown) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Wystąpił nieznany błąd');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async (email: string) => {
    try {
      setManagingUser(email);
      const data = await apiClient.post(`/api/admin/users/${email}/portal`, {});

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Nie udało się utworzyć sesji zarządzania');
      }
    } catch (err: unknown) {
      console.error('Error managing subscription:', err);
      setError(err instanceof Error ? err.message : 'Wystąpił nieznany błąd');
    } finally {
      setManagingUser(null);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [navigate]);

  const handlePageChange = (newPage: number) => {
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
            {users.map((user: User) => (
              <tr key={user.email}>
                <td>{user.name ?? '-'}</td>
                <td>{user.email}</td>
                <td>{user.subscriptionPlan}</td>
                <td
                  className={`status-${user.subscriptionStatus}${user.cancelAt ? ' status-canceling' : ''}`}
                >
                  {user.status}
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
