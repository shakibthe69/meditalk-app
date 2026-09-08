import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const BACKEND_PORT = 8080;

export const getApiBaseUrl = (): string => {
  // 1. If running in a Web browser (Desktop or Mobile Browser)
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    // e.g. "192.168.0.4" or "localhost"
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

  // 3. Fallback LAN IP of your backend server
  return `http://192.168.0.4:${BACKEND_PORT}`;
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
