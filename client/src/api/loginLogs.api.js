import api from './axios';

export const getLoginLogs = (params) => api.get('/login-logs', { params }).then((res) => res.data);
