import { useEffect, useState, useCallback } from 'react';
import { Receipt, Search, Calendar, User, Building2, Package } from 'lucide-react';
import { getInvoices, getInvoice, downloadInvoicePdf } from '../api/invoices.api';
import { formatCurrency } from '../utils/currency';
import { useToast } from '../context/ToastContext';
import Pagination from '../components/common/Pagination';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';

const inputClass = 'rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground placeholder-muted focus:border-amber-500 focus:outline-none';

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

  const [viewInvoice, setViewInvoice] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

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

  const handleView = async (invoice) => {
    setViewInvoice({ invoiceNumber: invoice.invoiceNumber });
    setViewLoading(true);
    try {
      const full = await getInvoice(invoice.id);
      setViewInvoice(full);
    } catch {
      showToast('Failed to load invoice', 'error');
      setViewInvoice(null);
    } finally {
      setViewLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader icon={Receipt} title="Invoices" subtitle="Every invoice generated from a stock-out" />

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
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

      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
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
              <tr key={inv.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-surface-muted/40">
                <td className="px-4 py-2 font-medium text-foreground">{inv.invoiceNumber}</td>
                <td className="px-4 py-2 text-muted">{new Date(inv.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2 text-foreground">{inv.buyerName}</td>
                <td className="px-4 py-2 text-muted">{inv.buyerCompany || '-'}</td>
                <td className="px-4 py-2 text-muted">{inv.itemCount}</td>
                <td className="px-4 py-2 text-muted">{formatCurrency(inv.totalAmount)}</td>
                <td className="px-4 py-2 text-muted">{inv.user.fullName}</td>
                <td className="px-4 py-2">
                  <button onClick={() => handleView(inv)} className="mr-3 text-muted hover:underline">
                    View
                  </button>
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

      <Modal open={!!viewInvoice} title={viewInvoice?.invoiceNumber || 'Invoice'} onClose={() => setViewInvoice(null)} size="xl">
        {viewLoading && <Spinner label="Loading invoice..." />}
        {!viewLoading && viewInvoice?.movements && (
          <div className="animate-fade-in space-y-5">
            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-surface-muted p-4 sm:grid-cols-4">
              <div className="flex items-start gap-2.5">
                <Calendar size={16} className="mt-0.5 shrink-0 text-amber-500" />
                <div>
                  <p className="text-xs text-muted">Date</p>
                  <p className="text-sm font-medium text-foreground">{new Date(viewInvoice.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <User size={16} className="mt-0.5 shrink-0 text-amber-500" />
                <div>
                  <p className="text-xs text-muted">Buyer</p>
                  <p className="text-sm font-medium text-foreground">{viewInvoice.buyerName}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Building2 size={16} className="mt-0.5 shrink-0 text-amber-500" />
                <div>
                  <p className="text-xs text-muted">Company</p>
                  <p className="text-sm font-medium text-foreground">{viewInvoice.buyerCompany || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <User size={16} className="mt-0.5 shrink-0 text-amber-500" />
                <div>
                  <p className="text-xs text-muted">Sold by</p>
                  <p className="text-sm font-medium text-foreground">{viewInvoice.user.fullName}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">Items ({viewInvoice.movements.length})</p>
              <div className="max-h-[22rem] overflow-auto rounded-2xl border border-border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border text-left text-muted">
                      <th className="px-4 py-2.5 font-medium">Part</th>
                      <th className="px-4 py-2.5 font-medium">Brand</th>
                      <th className="px-4 py-2.5 font-medium">Qty</th>
                      <th className="px-4 py-2.5 font-medium">Unit Price</th>
                      <th className="px-4 py-2.5 font-medium">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewInvoice.movements.map((m) => (
                      <tr key={m.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-surface-muted/40">
                        <td className="px-4 py-2.5 text-foreground">
                          {m.product.name}
                          <div className="text-xs text-muted">{m.product.partNumber}</div>
                        </td>
                        <td className="px-4 py-2.5 text-muted">{m.product.brand.name}</td>
                        <td className="px-4 py-2.5 text-muted">{m.quantity} {m.product.unit}</td>
                        <td className="px-4 py-2.5 text-muted">{formatCurrency(m.unitPrice)}</td>
                        <td className="px-4 py-2.5 font-medium text-foreground">{formatCurrency(Number(m.unitPrice) * m.quantity)}</td>
                      </tr>
                    ))}
                    {viewInvoice.movements.length === 0 && (
                      <tr>
                        <td colSpan={5}>
                          <EmptyState icon={Package} message="No items on this invoice" />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-border bg-surface-muted p-4">
              <p className="text-base font-semibold text-foreground">Total: {formatCurrency(viewInvoice.totalAmount)}</p>
              <Button type="button" variant="secondary" onClick={() => handleDownload(viewInvoice)} disabled={downloadingId === viewInvoice.id}>
                {downloadingId === viewInvoice.id ? 'Downloading...' : 'Download PDF'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
