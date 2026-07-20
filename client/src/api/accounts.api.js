import api from './axios';

export const getAccountInvoices = (params) => api.get('/accounts/invoices', { params }).then((res) => res.data);
export const getAccountSummary = (params) => api.get('/accounts/summary', { params }).then((res) => res.data);
export const getMonthlyAccounts = (params) => api.get('/accounts/monthly', { params }).then((res) => res.data);
export const getBalanceSheet = () => api.get('/accounts/balance-sheet').then((res) => res.data);
