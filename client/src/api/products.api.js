import api from './axios';

export const getProducts = (params) => api.get('/products', { params }).then((res) => res.data);
export const getLowStockProducts = () => api.get('/products/low-stock').then((res) => res.data);
export const getProduct = (id) => api.get(`/products/${id}`).then((res) => res.data);
export const createProduct = (data) => api.post('/products', data).then((res) => res.data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data).then((res) => res.data);
export const deleteProduct = (id) => api.delete(`/products/${id}`).then((res) => res.data);
