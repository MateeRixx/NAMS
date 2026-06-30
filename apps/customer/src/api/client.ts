import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('customer_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginRequest = err.config?.url?.includes('/auth/') && err.config?.method === 'post';
    if (err.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('customer_token');
      localStorage.removeItem('customer_user');
      window.location.href = '/login';
    }
    const msg =
      err.response?.data?.error?.message ??
      err.response?.data?.message ??
      err.message ??
      'Something went wrong';
    return Promise.reject(new Error(msg));
  }
);

export default client;
