import { AuthResponse, ForgotPasswordResponse, ResetPasswordResponse } from '../types/auth.types';
import apiClient from './apiClient';




export const authService = {
  login: (email: string, password: string): Promise<AuthResponse> => {
    return apiClient.post('/api/login', { email, password });
  },

  forgotPassword: (email: string): Promise<ForgotPasswordResponse> => {
    return apiClient.post('/api/forgot-password', { email });
  },

  resetPassword: (token: string, password: string): Promise<ResetPasswordResponse> => {
    return apiClient.post('/api/reset-password', { token, password });
  }
};

export default authService; 