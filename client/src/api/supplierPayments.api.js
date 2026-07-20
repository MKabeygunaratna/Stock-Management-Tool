import api from './axios';

export const recordSupplierPayment = (data) => api.post('/supplier-payments', data).then((res) => res.data);
