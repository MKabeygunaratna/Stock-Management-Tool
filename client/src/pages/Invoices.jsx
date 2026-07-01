import { useEffect, useState, useCallback } from 'react';
import { Receipt, Search } from 'lucide-react';
import { getInvoices, downloadInvoicePdf } from '../api/invoices.api';
import { formatCurrency } from '../utils/currency';
import { useToast } from '../context/ToastContext';
import Pagination from '../components/common/Pagination';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';

const inputClass = 'rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none';

export default function Invoices() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  const load = useCallback(() => {
    getInvoices({ page, search: search || undefined, from: from || undefined, to: to || undefined })
      .then((data) => {
        setItems(data.items);
        setTotalPages(data.totalPages);
      })
      .catch(() => setError('Failed to load invoices'));
  }, [page, search, from, to]);

  useEffect(load, [load]);

  const handleDownload = async (invoice) => {
    setDownloadingId(invoice.id);
    try {
      await downloadInvoicePdf(invoice.id, invoice.invoiceNumber);
      showToast(`Downloaded ${invoice.invoiceNumber}`);
    } catch {
      showToast('Failed to download PDF', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader icon={Receipt} title="Invoices" subtitle="Every invoice generated from a stock-out" />

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            placeholder="Search buyer, company, or invoice #"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            className={`${inputClass} py-2 pl-8 pr-3`}
          />
        </div>
        <input type="date" value={from} onChange={(e) => { setPage(1); setFrom(e.target.value); }} className={inputClass} />
        <input type="date" value={to} onChange={(e) => { setPage(1); setTo(e.target.value); }} className={inputClass} />
      </div>

      {error && <p className="text-red-400">{error}</p>}

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 shadow-sm">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-zinc-500">
              <th className="px-4 py-2 font-medium">Invoice #</th>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Buyer</th>
              <th className="px-4 py-2 font-medium">Company</th>
              <th className="px-4 py-2 font-medium">Items</th>
              <th className="px-4 py-2 font-medium">Total</th>
              <th className="px-4 py-2 font-medium">By</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((inv) => (
              <tr key={inv.id} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/40">
                <td className="px-4 py-2 font-medium text-zinc-100">{inv.invoiceNumber}</td>
                <td className="px-4 py-2 text-zinc-500">{new Date(inv.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2 text-zinc-200">{inv.buyerName}</td>
                <td className="px-4 py-2 text-zinc-500">{inv.buyerCompany || '-'}</td>
                <td className="px-4 py-2 text-zinc-300">{inv.itemCount}</td>
                <td className="px-4 py-2 text-zinc-300">{formatCurrency(inv.totalAmount)}</td>
                <td className="px-4 py-2 text-zinc-500">{inv.user.fullName}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleDownload(inv)}
                    disabled={downloadingId === inv.id}
                    className="text-amber-500 hover:underline disabled:opacity-50"
                  >
                    {downloadingId === inv.id ? 'Downloading...' : 'Download PDF'}
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <EmptyState icon={Receipt} message="No invoices found" />
                </td>
              </tr>
            )}
          </tbody>
        </table></div>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}
