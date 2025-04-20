import { Pagination } from '../types/shared.types';
import { BackendUser, User } from '../types/user.types';
import apiClient from './apiClient';

export const mapBackendUserToFrontend = (user: BackendUser): User => {
  return {
    ...user,
    cancelAt: user.cancel_at,
    isAdmin: user.is_admin,
    subscriptionStatus: user.subscription_status,
    subscriptionPlan: user.subscription_plan,
    subscriptionStartDate: user.subscription_start_date,
    status: formatStatus(user.subscription_status, user.cancel_at),
    isSubscribed: user.subscription_status === 'active', // TODO probably more options to check
  };
};

export const mapBackendUsersToFrontend = (backendUsers: BackendUser[]): User[] => {
  return backendUsers.map(mapBackendUserToFrontend);
};

export const fetchAdminUsers = async (
  page: number,
  limit: number
): Promise<{ users: User[]; pagination: Pagination }> => {
  const response = await apiClient.get<{ users: BackendUser[]; pagination: Pagination }>(
    `/api/admin/users/subscriptions?page=${page}&limit=${limit}`
  );
  return {
    users: mapBackendUsersToFrontend(response.users),
    pagination: response.pagination,
  };
};

export const fetchUserProfile = async (email: string): Promise<User> => {
  const backendUserData = await apiClient.get<BackendUser>(`/api/users/${email}`);
  return mapBackendUserToFrontend(backendUserData);
};

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
  return (statusMap as any)[status] || status;
};
