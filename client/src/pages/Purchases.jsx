import { useEffect, useState, useCallback } from 'react';
import { ShoppingCart, Plus } from 'lucide-react';
import { getProducts } from '../api/products.api';
import { getPurchaseOrders, getPurchaseOrder, createPurchaseOrder, downloadPurchaseOrderPdf } from '../api/purchases.api';
import { formatCurrency } from '../utils/currency';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';
import NewPurchaseItemForm from '../components/forms/NewPurchaseItemForm';

const inputClass =
  'w-full rounded-md border border-input bg-surface-muted px-3 py-2 text-sm text-foreground placeholder-muted focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500';
const labelClass = 'mb-1 block text-sm font-medium text-muted';

const conditionLabel = (condition) => (condition === 'RECONDITION' ? 'Recondition' : 'Brand New');

export default function Purchases() {
  const { showToast } = useToast();

  const [lowStockItems, setLowStockItems] = useState([]);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState([]);
  const [cart, setCart] = useState([]);
  const [itemModalOpen, setItemModalOpen] = useState(false);

  const [supplierName, setSupplierName] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [downloadingId, setDownloadingId] = useState(null);

  const [viewOrder, setViewOrder] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  useEffect(() => {
    getProducts({ lowStock: true, limit: 50 })
      .then((data) => setLowStockItems(data.items))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      getProducts({ search: search || undefined, limit: 20 })
        .then((data) => setOptions(data.items))
        .catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const loadOrders = useCallback(() => {
    getPurchaseOrders({ page })
      .then((data) => {
        setOrders(data.items);
        setTotalPages(data.totalPages);
      })
      .catch(() => {});
  }, [page]);

  useEffect(loadOrders, [loadOrders]);

  const addExistingToCart = (product) => {
    setSearch('');
    setOptions([]);
    setCart((prev) => {
      const existing = prev.find((line) => line.productId === product.id);
      if (existing) {
        return prev.map((line) =>
          line.productId === product.id ? { ...line, quantity: line.quantity + 1 } : line
        );
      }
      const suggestedQty = Math.max(1, product.reorderLevel - product.currentStock);
      return [...prev, {
        key: `p-${product.id}`,
        productId: product.id,
        partNumber: product.partNumber,
        name: product.name,
        brandName: product.brand.name,
        condition: product.condition,
        quantity: suggestedQty,
        estimatedCost: Number(product.costPrice),
        isNew: false,
      }];
    });
  };

  const addNewItem = (item) => {
    setCart((prev) => [...prev, { key: `n-${Date.now()}`, productId: null, isNew: true, ...item }]);
    setItemModalOpen(false);
  };

  const updateLine = (key, field, value) => {
    setCart((prev) => prev.map((line) => (line.key === key ? { ...line, [field]: value } : line)));
  };

  const removeLine = (key) => setCart((prev) => prev.filter((line) => line.key !== key));

  const grandTotal = cart.reduce((sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.estimatedCost) || 0), 0);

  const resetForm = () => {
    setCart([]);
    setSupplierName('');
    setNotes('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (cart.length === 0) {
      setError('Add at least one item to the purchase list');
      return;
    }
    for (const line of cart) {
      if (!line.quantity || line.quantity <= 0) {
        setError(`Enter a valid quantity for ${line.name}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const order = await createPurchaseOrder({
        supplierName,
        notes,
        items: cart.map((line) => ({
          productId: line.productId,
          partNumber: line.partNumber,
          name: line.name,
          brandName: line.brandName,
          condition: line.condition,
          quantity: Number(line.quantity),
          estimatedCost: Number(line.estimatedCost) || 0,
        })),
      });
      showToast(`Purchase order ${order.orderNumber} created`);
      resetForm();
      loadOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (order) => {
    setDownloadingId(order.id);
    try {
      await downloadPurchaseOrderPdf(order.id, order.orderNumber);
      showToast(`Downloaded ${order.orderNumber}`);
    } catch {
      showToast('Failed to download PDF', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleView = async (order) => {
    setViewOrder({ orderNumber: order.orderNumber });
    setViewLoading(true);
    try {
      const full = await getPurchaseOrder(order.id);
      setViewOrder(full);
    } catch {
      showToast('Failed to load purchase order', 'error');
      setViewOrder(null);
    } finally {
      setViewLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader icon={ShoppingCart} title="Purchases" subtitle="Build a purchase order for low-stock or new parts" />

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</div>
        )}

        {lowStockItems.length > 0 && (
          <div>
            <label className={labelClass}>Low Stock &mdash; Quick Add</label>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => addExistingToCart(p)}
                  className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-300 hover:bg-red-500/20"
                >
                  + {p.name} ({p.currentStock}/{p.reorderLevel})
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className={labelClass}>Add Existing Part</label>
            <input
              placeholder="Search by name or part number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={inputClass}
            />
            {search && options.length > 0 && (
              <div className="mt-1 max-h-48 overflow-y-auto rounded-md border border-input bg-card shadow-lg">
                {options.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => addExistingToCart(p)}
                    className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-surface-muted"
                  >
                    <span className="font-medium">{p.partNumber}</span> - {p.name}
                    <span className="ml-2 text-xs text-muted">({p.brand.name}, stock: {p.currentStock})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button type="button" variant="secondary" onClick={() => setItemModalOpen(true)}>
            <Plus size={16} /> New Item
          </Button>
        </div>

        {cart.length > 0 && (
          <div className="rounded-md border border-border">
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="px-3 py-2 font-medium">Part</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Condition</th>
                  <th className="px-3 py-2 font-medium">Qty</th>
                  <th className="px-3 py-2 font-medium">Est. Unit Cost</th>
                  <th className="px-3 py-2 font-medium">Line Total</th>
                  <th className="px-3 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((line) => (
                  <tr key={line.key} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-2 text-foreground">
                      {line.name}
                      <div className="text-xs text-muted">{line.partNumber || '-'} {line.brandName ? `· ${line.brandName}` : ''}</div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={line.isNew ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                        {line.isNew ? 'New Item' : 'Existing'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted">{conditionLabel(line.condition)}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => updateLine(line.key, 'quantity', Number(e.target.value))}
                        className="w-20 rounded-md border border-input bg-surface-muted px-2 py-1 text-sm text-foreground focus:border-amber-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.estimatedCost}
                        onChange={(e) => updateLine(line.key, 'estimatedCost', e.target.value)}
                        className="w-24 rounded-md border border-input bg-surface-muted px-2 py-1 text-sm text-foreground focus:border-amber-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2 text-muted">{formatCurrency((Number(line.quantity) || 0) * (Number(line.estimatedCost) || 0))}</td>
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => removeLine(line.key)} className="text-red-600 dark:text-red-400 hover:underline">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            <div className="border-t border-border px-3 py-2 text-right text-sm font-semibold text-foreground">
              Estimated Total: {formatCurrency(grandTotal)}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Supplier Name (optional)</label>
            <input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Notes (optional)</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
          </div>
        </div>

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Creating...' : 'Create Purchase Order'}
        </Button>
      </form>

      <Modal open={itemModalOpen} title="Add New Item" onClose={() => setItemModalOpen(false)}>
        <NewPurchaseItemForm onSubmit={addNewItem} onCancel={() => setItemModalOpen(false)} />
      </Modal>

      <div className="rounded-lg border border-border bg-card shadow-sm">
        <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">Purchase Order History</h2>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="px-4 py-2 font-medium">Order #</th>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Supplier</th>
              <th className="px-4 py-2 font-medium">Items</th>
              <th className="px-4 py-2 font-medium">Est. Total</th>
              <th className="px-4 py-2 font-medium">By</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-border/60 last:border-0 hover:bg-surface-muted/40">
                <td className="px-4 py-2 font-medium text-foreground">{o.orderNumber}</td>
                <td className="px-4 py-2 text-muted">{new Date(o.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2 text-muted">{o.supplierName || '-'}</td>
                <td className="px-4 py-2 text-muted">{o.itemCount}</td>
                <td className="px-4 py-2 text-muted">{formatCurrency(o.totalEstimatedCost)}</td>
                <td className="px-4 py-2 text-muted">{o.user.fullName}</td>
                <td className="px-4 py-2">
                  <button onClick={() => handleView(o)} className="mr-3 text-muted hover:underline">
                    View
                  </button>
                  <button
                    onClick={() => handleDownload(o)}
                    disabled={downloadingId === o.id}
                    className="text-amber-500 hover:underline disabled:opacity-50"
                  >
                    {downloadingId === o.id ? 'Downloading...' : 'Download PDF'}
                  </button>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <EmptyState icon={ShoppingCart} message="No purchase orders yet" />
                </td>
              </tr>
            )}
          </tbody>
        </table></div>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>

      <Modal open={!!viewOrder} title={viewOrder?.orderNumber || 'Purchase Order'} onClose={() => setViewOrder(null)}>
        {viewLoading && <Spinner label="Loading order..." />}
        {!viewLoading && viewOrder?.items && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p className="text-muted">Date</p>
              <p className="text-foreground">{new Date(viewOrder.createdAt).toLocaleString()}</p>
              <p className="text-muted">Supplier</p>
              <p className="text-foreground">{viewOrder.supplierName || '-'}</p>
              <p className="text-muted">Notes</p>
              <p className="text-foreground">{viewOrder.notes || '-'}</p>
              <p className="text-muted">Requested by</p>
              <p className="text-foreground">{viewOrder.user.fullName}</p>
            </div>

            <div className="max-h-64 overflow-y-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted">
                    <th className="px-3 py-2 font-medium">Part</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Condition</th>
                    <th className="px-3 py-2 font-medium">Qty</th>
                    <th className="px-3 py-2 font-medium">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {viewOrder.items.map((item) => (
                    <tr key={item.id} className="border-b border-border/60 last:border-0">
                      <td className="px-3 py-2 text-foreground">
                        {item.name}
                        <div className="text-xs text-muted">{item.partNumber || '-'} {item.brandName ? `· ${item.brandName}` : ''}</div>
                      </td>
                      <td className="px-3 py-2">
                        <span className={item.isNew ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>{item.isNew ? 'New Item' : 'Existing'}</span>
                      </td>
                      <td className="px-3 py-2 text-muted">{conditionLabel(item.condition)}</td>
                      <td className="px-3 py-2 text-muted">{item.quantity}</td>
                      <td className="px-3 py-2 text-muted">{formatCurrency(Number(item.estimatedCost) * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-sm font-semibold text-foreground">Estimated Total: {formatCurrency(viewOrder.totalEstimatedCost)}</p>
              <Button type="button" variant="secondary" onClick={() => handleDownload(viewOrder)} disabled={downloadingId === viewOrder.id}>
                {downloadingId === viewOrder.id ? 'Downloading...' : 'Download PDF'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
