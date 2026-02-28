import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agency_client_token') || localStorage.getItem('agency_admin_token') || localStorage.getItem('agency_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`[Frontend Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.data);
  return config;
});
