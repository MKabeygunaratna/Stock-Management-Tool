import api from './axios';

export const stockIn = (data) => api.post('/stock/in', data).then((res) => res.data);
export const stockOut = (data) => api.post('/stock/out', data).then((res) => res.data);
export const getStockHistory = (params) => api.get('/stock/history', { params }).then((res) => res.data);
