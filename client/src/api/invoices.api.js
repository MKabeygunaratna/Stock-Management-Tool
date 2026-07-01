import api from './axios';

export const getInvoices = (params) => api.get('/invoices', { params }).then((res) => res.data);
export const getInvoice = (id) => api.get(`/invoices/${id}`).then((res) => res.data);

export const downloadInvoicePdf = async (id, invoiceNumber) => {
  const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${invoiceNumber || `invoice-${id}`}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
