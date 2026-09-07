import { apiClient, setAuthTokenHeader } from './apiClient';
import { AuthResponse, LoginPayload, RegisterPayload, User } from '../../types';

export const authApi = {
  login: async (credentials: LoginPayload): Promise<AuthResponse> => {
    const res = await apiClient.post('/api/auth/login', credentials);
    if (res.data.data?.token) {
      setAuthTokenHeader(res.data.data.token);
    }
    return res.data.data;
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const res = await apiClient.post('/api/auth/register', payload);
    if (res.data.data?.token) {
      setAuthTokenHeader(res.data.data.token);
    }
    return res.data.data;
  },

  getProfile: async (): Promise<User> => {
    const res = await apiClient.get('/api/users/profile');
    return res.data.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const res = await apiClient.put('/api/users/profile', data);
    return res.data.data;
  },
};
