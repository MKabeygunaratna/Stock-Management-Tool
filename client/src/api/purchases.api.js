import api from './axios';

export const getPurchaseOrders = (params) => api.get('/purchases', { params }).then((res) => res.data);
export const getPurchaseOrder = (id) => api.get(`/purchases/${id}`).then((res) => res.data);
export const createPurchaseOrder = (data) => api.post('/purchases', data).then((res) => res.data);

export const downloadPurchaseOrderPdf = async (id, orderNumber) => {
  const res = await api.get(`/purchases/${id}/pdf`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${orderNumber || `purchase-${id}`}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
