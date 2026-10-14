import axios from 'axios';

const envUrl = (import.meta as any).env?.VITE_API_URL;
const API_BASE_URL = envUrl || (window.location.hostname === 'localhost' ? 'http://localhost:5001/api/v1' : 'https://api.houseandsky.com/api/v1');


const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hippo_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData && config.headers) {
    if (typeof (config.headers as any).delete === 'function') {
      (config.headers as any).delete('Content-Type');
      (config.headers as any).delete('content-type');
    } else {
      delete (config.headers as any)['Content-Type'];
      delete (config.headers as any)['content-type'];
    }
  }

  return config;
});

// Normalise backend errors into a single friendly message and handle expired /
// invalid sessions globally (401 -> clear auth and bounce to login).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    let friendlyMessage = data?.message || 'Something went wrong. Please try again.';
    if (data?.errors && typeof data.errors === 'object') {
      // Validation errors: { field: message } -> "message1, message2"
      friendlyMessage = Object.values(data.errors).join(', ');
    }
    if (status === 429) {
      friendlyMessage = data?.message || 'Too many attempts. Please wait and try again.';
    }
    error.friendlyMessage = friendlyMessage;

    if (status === 401 && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/join')) {
      localStorage.removeItem('hippo_token');
      localStorage.removeItem('hippo_user');
      localStorage.removeItem('hippo_employee');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
