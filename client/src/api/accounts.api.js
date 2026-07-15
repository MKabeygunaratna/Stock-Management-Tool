import api from './axios';

export const getAccountInvoices = (params) => api.get('/accounts/invoices', { params }).then((res) => res.data);
export const getAccountSummary = (params) => api.get('/accounts/summary', { params }).then((res) => res.data);
