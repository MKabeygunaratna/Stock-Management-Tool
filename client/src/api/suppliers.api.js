import api from './axios';

export const getSuppliers = (params) => api.get('/suppliers', { params }).then((res) => res.data);
export const getAllSuppliers = () => api.get('/suppliers/all').then((res) => res.data);
export const getSupplier = (id) => api.get(`/suppliers/${id}`).then((res) => res.data);
export const createSupplier = (data) => api.post('/suppliers', data).then((res) => res.data);
export const updateSupplier = (id, data) => api.put(`/suppliers/${id}`, data).then((res) => res.data);
export const deleteSupplier = (id) => api.delete(`/suppliers/${id}`).then((res) => res.data);
