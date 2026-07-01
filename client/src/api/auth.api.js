import api from './axios';

export const login = (username, password) =>
  api.post('/auth/login', { username, password }).then((res) => res.data);

export const me = () => api.get('/auth/me').then((res) => res.data);

export const logout = () => api.post('/auth/logout').then((res) => res.data);
