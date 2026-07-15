import api from './axios';

export const recordPayment = (data) => api.post('/payments', data).then((res) => res.data);
