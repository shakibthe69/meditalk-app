import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const BACKEND_PORT = 8080;
const DEFAULT_BACKEND_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export const getApiBaseUrl = (): string => {
  const configuredBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, '');
  }

  // 1. If running in a browser, prefer the local backend running on the same machine.
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
      return `http://localhost:${BACKEND_PORT}`;
    }
    return `http://${host}:${BACKEND_PORT}`;
  }

  // 2. If running inside Expo Go / React Native on Android or iOS
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any).manifest?.debuggerHost;

  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:${BACKEND_PORT}`;
    }
  }

  // 3. Local fallback for the same machine.
  return DEFAULT_BACKEND_URL;
};

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

let authToken: string | null = null;

export const setAuthTokenHeader = (token: string | null) => {
  authToken = token;
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

apiClient.interceptors.request.use((config) => {
  // Dynamically update baseURL in case network context changed
  config.baseURL = getApiBaseUrl();

  if (authToken && !config.headers['Authorization']) {
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized API call. Session expired.');
    }
    return Promise.reject(error);
  }
);
