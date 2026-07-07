import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_TIMEOUT } from '@env';
const BASE_URL = (API_BASE_URL).replace(/\/+$/, '');

const API_PREFIX = 'auth/api/v1';

// TEMP DEBUG — remove once network issue is resolved.
console.log('[api] API_BASE_URL =', API_BASE_URL);
console.log('[api] baseURL =', `${BASE_URL}/${API_PREFIX}`);

export const REQUEST_TIMEOUT_MS = Number(API_TIMEOUT);

export const ACCESS_TOKEN_KEY = 'auth_access_token';

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
  },
};

// Shared axios instance for the whole app.
const apiClient = axios.create({
  baseURL: `${BASE_URL}/${API_PREFIX}`,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Attach the bearer token to every request when one is stored.
apiClient.interceptors.request.use(async config => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) {
    // No stored token / storage unavailable — send the request unauthenticated.
  }
  return config;
});

// TEMP DEBUG — log the real network failure. Remove once resolved.
apiClient.interceptors.response.use(
  response => response,
  error => {
    console.log('[api] request failed →', error.config?.baseURL, error.config?.url);
    console.log('[api] message:', error.message, '| code:', error.code);
    console.log('[api] has response?', !!error.response, '| status:', error.response?.status);
    return Promise.reject(error);
  },
);

export { BASE_URL, API_PREFIX };

export default apiClient;
