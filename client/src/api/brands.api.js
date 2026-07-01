import api from './axios';

export const getBrands = () => api.get('/brands').then((res) => res.data);
export const createBrand = (data) => api.post('/brands', data).then((res) => res.data);
export const updateBrand = (id, data) => api.put(`/brands/${id}`, data).then((res) => res.data);
export const deleteBrand = (id) => api.delete(`/brands/${id}`).then((res) => res.data);
