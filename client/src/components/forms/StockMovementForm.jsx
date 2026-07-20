import { useEffect, useState } from 'react';
import { Banknote, CreditCard } from 'lucide-react';
import { getProducts } from '../../api/products.api';
import { getAllSuppliers } from '../../api/suppliers.api';
import { formatCurrency } from '../../utils/currency';
import { useToast } from '../../context/ToastContext';
import Button from '../common/Button';

const inputClass =
  'w-full rounded-md border border-input bg-surface-muted px-3 py-2 text-sm text-foreground placeholder-muted focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500';
const labelClass = 'mb-1 block text-sm font-medium text-muted';

export default function StockMovementForm({ onSubmit }) {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [paidAmount, setPaidAmount] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      getProducts({ search: search || undefined, limit: 20 })
        .then((data) => setOptions(data.items))
        .catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    getAllSuppliers().then(setSuppliers).catch(() => {});
  }, []);

  // Auto-suggest the part's usual supplier the first time one is chosen.
  useEffect(() => {
    if (selected?.supplierId && !supplierId) {
      setSupplierId(String(selected.supplierId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const selectedSupplier = suppliers.find((s) => String(s.id) === String(supplierId));
  const qtyNum = Number(quantity) || 0;
  const totalCost = selected ? qtyNum * Number(selected.costPrice) : 0;
  const paidNum = paidAmount === '' ? 0 : Number(paidAmount) || 0;
  const remaining = Math.max(0, totalCost - paidNum);

  const resetForm = () => {
    setSelected(null);
    setSearch('');
    setQuantity('');
    setReason('');
    setReference('');
    setOptions([]);
    setSupplierId('');
    setPaidAmount('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selected) {
      setError('Select a part first');
      return;
    }
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setError('Enter a valid quantity');
      return;
    }
    if (supplierId && paidNum > totalCost + 0.005) {
      setError(`Amount paid can't exceed the total cost of ${formatCurrency(totalCost)}`);
      return;
    }

    setSubmitting(true);
    try {
      const movement = await onSubmit({
        productId: selected.id,
        quantity: qty,
        reason,
        reference,
        supplierId: supplierId || undefined,
        paidAmount: supplierId ? paidNum : undefined,
      });
      let supplierNote = '';
      if (supplierId) {
        supplierNote = remaining > 0.005
          ? ` — ${formatCurrency(paidNum)} paid, ${formatCurrency(remaining)} added to ${selectedSupplier?.name || 'supplier'}'s payable`
          : ' (paid in full)';
      }
      showToast(`Received ${qty} ${selected.unit} of ${selected.name}${supplierNote}. New stock: ${movement.stockAfter}`);
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record movement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      <div>
        <label className={labelClass}>Part</label>
        <input
          placeholder="Search by name or part number"
          value={selected ? `${selected.partNumber} - ${selected.name}` : search}
          onChange={(e) => { setSelected(null); setSearch(e.target.value); }}
          className={inputClass}
        />
        {!selected && search && options.length > 0 && (
          <div className="mt-1 max-h-48 overflow-y-auto rounded-md border border-input bg-card shadow-lg">
            {options.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => { setSelected(p); setSearch(''); }}
                className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-surface-muted"
              >
                <span className="font-medium">{p.partNumber}</span> - {p.name}
                <span className="ml-2 text-xs text-muted">({p.brand.name}, stock: {p.currentStock})</span>
              </button>
            ))}
          </div>
        )}
        {selected && (
          <p className="mt-1 text-xs text-muted">
            Current stock: {selected.currentStock} {selected.unit} — Brand: {selected.brand.name} — Cost: {formatCurrency(selected.costPrice)}/{selected.unit}
          </p>
        )}
      </div>

      <div>
        <label className={labelClass}>Quantity</label>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className={inputClass}
          required
        />
        {selected && qtyNum > 0 && (
          <p className="mt-1 text-xs text-muted">Total cost: {formatCurrency(totalCost)}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>Supplier (optional)</label>
        <select
          value={supplierId}
          onChange={(e) => { setSupplierId(e.target.value); setPaidAmount(''); }}
          className={inputClass}
        >
          <option value="">No supplier / not tracked</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>{s.name}{s.company ? ` — ${s.company}` : ''}</option>
          ))}
        </select>
      </div>

      {supplierId && (
        <div className="animate-fade-in space-y-2">
          <label className={labelClass}>Payment</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaidAmount(totalCost > 0 ? totalCost.toFixed(2) : '')}
              className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-all ${
                totalCost > 0 && remaining <= 0.005
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'border-input bg-surface-muted text-muted hover:text-foreground'
              }`}
            >
              <Banknote size={15} /> Paid in Full
            </button>
            <button
              type="button"
              onClick={() => setPaidAmount('0')}
              className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-all ${
                paidNum === 0
                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'border-input bg-surface-muted text-muted hover:text-foreground'
              }`}
            >
              <CreditCard size={15} /> Full Credit
            </button>
          </div>

          <div>
            <label className={labelClass}>Amount Paid Now (Rs.)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder="0.00"
              className={inputClass}
            />
          </div>

          {totalCost > 0 && (
            <p className="text-xs text-muted">
              {remaining > 0.005
                ? `${formatCurrency(remaining)} will be added to ${selectedSupplier?.name || 'the supplier'}'s payable balance.`
                : 'Fully paid — nothing will be added to payable.'}
            </p>
          )}
        </div>
      )}

      <div>
        <label className={labelClass}>Reason</label>
        <input
          placeholder="e.g. Purchase from supplier X"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Reference (invoice/PO number)</label>
        <input value={reference} onChange={(e) => setReference(e.target.value)} className={inputClass} />
      </div>

      <Button type="submit" variant="success" disabled={submitting} className="w-full">
        {submitting ? 'Saving...' : 'Record Stock In'}
      </Button>
    </form>
  );
}
