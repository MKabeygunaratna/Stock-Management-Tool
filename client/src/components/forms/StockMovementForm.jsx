import { useEffect, useState } from 'react';
import { getProducts } from '../../api/products.api';
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

  useEffect(() => {
    const timer = setTimeout(() => {
      getProducts({ search: search || undefined, limit: 20 })
        .then((data) => setOptions(data.items))
        .catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

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

    setSubmitting(true);
    try {
      const movement = await onSubmit({ productId: selected.id, quantity: qty, reason, reference });
      showToast(`Received ${qty} ${selected.unit} of ${selected.name}. New stock: ${movement.stockAfter}`);
      setSelected(null);
      setSearch('');
      setQuantity('');
      setReason('');
      setReference('');
      setOptions([]);
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
            Current stock: {selected.currentStock} {selected.unit} — Brand: {selected.brand.name}
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
      </div>

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
