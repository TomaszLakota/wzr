import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/adminPanel.scss';
import apiClient from '../../services/apiClient';

// Define interfaces for state and data structures
interface User {
  email: string;
  name: string | null; // Assuming name can be null based on potential database structure
  subscriptionPlan: string | null;
  subscriptionStatus: string;
  subscriptionStartDate: string | null; // Assuming date comes as string
  cancelAt: string | null; // Assuming date comes as string or null
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Helper function to format subscription status in Polish
const formatStatus = (status: string, cancelAt: string | null): string => {
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
  return (statusMap as any)[status] || status; // Use 'as any' for dynamic access, or define statusMap type more strictly if needed
};

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
      const data = await apiClient.get<{ users: User[]; pagination: Pagination }>(
        `/api/admin/users/subscriptions?page=${page}&limit=${pagination.limit}`
      );

      setUsers(data.users);
      setPagination((prev) => ({
        ...prev,
        page: data.pagination.page,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
      }));
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
