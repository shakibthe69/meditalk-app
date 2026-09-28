import { create } from 'zustand';
import { User, LoginPayload, RegisterPayload, DoctorRegisterPayload } from '../types';
import { authApi, setAuthTokenHeader } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;

  login: (credentials: LoginPayload) => Promise<{ success: boolean; message?: string }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; message?: string }>;
  registerDoctor: (payload: DoctorRegisterPayload) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  completeOnboarding: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  hasCompletedOnboarding: true,

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const authRes = await authApi.login(credentials);
      setAuthTokenHeader(authRes.token);
      set({
        user: authRes.user,
        token: authRes.token,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true };
    } catch (error: any) {
      set({ isLoading: false });
      const msg =
        error.response?.data?.message ||
        (error.message ? `${error.message}. Please check connection to ${error.config?.baseURL || 'backend'}.` : 'Login failed. Please check credentials.');
      return { success: false, message: msg };
    }
  },

  register: async (payload) => {
    set({ isLoading: true });
    try {
      const authRes = await authApi.register(payload);
      setAuthTokenHeader(authRes.token);
      set({
        user: authRes.user,
        token: authRes.token,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true };
    } catch (error: any) {
      set({ isLoading: false });
      const msg =
        error.response?.data?.message ||
        (error.message ? `${error.message}. Please check connection to ${error.config?.baseURL || 'backend'}.` : 'Registration failed.');
      return { success: false, message: msg };
    }
  },

  registerDoctor: async (payload) => {
    set({ isLoading: true });
    try {
      const authRes = await authApi.registerDoctor(payload);
      setAuthTokenHeader(authRes.token);
      set({
        user: authRes.user,
        token: authRes.token,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true };
    } catch (error: any) {
      set({ isLoading: false });
      const msg =
        error.response?.data?.message ||
        (error.message ? `${error.message}. Please check connection to ${error.config?.baseURL || 'backend'}.` : 'Doctor registration failed.');
      return { success: false, message: msg };
    }
  },

  logout: () => {
    setAuthTokenHeader(null);
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  completeOnboarding: () => {
    set({ hasCompletedOnboarding: true });
  },

  updateUser: async (data) => {
    try {
      const updated = await authApi.updateProfile(data);
      set({ user: updated });
    } catch (error) {
      console.warn('Failed to update profile on backend:', error);
    }
  },

  fetchCurrentUser: async () => {
    if (!get().token) return;
    try {
      const profile = await authApi.getProfile();
      set({ user: profile });
    } catch (error) {
      console.warn('Failed to fetch user profile:', error);
    }
  },
}));
