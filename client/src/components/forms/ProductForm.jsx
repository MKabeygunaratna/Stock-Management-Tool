import { useEffect, useRef, useState } from 'react';
import Button from '../common/Button';
import { suggestPartNumber } from '../../api/products.api';

const inputClass =
  'w-full rounded-md border border-input bg-surface-muted px-3 py-2 text-sm text-foreground placeholder-muted focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50';
const labelClass = 'mb-1 block text-sm font-medium text-muted';

const emptyForm = {
  partNumber: '',
  name: '',
  description: '',
  unit: 'pcs',
  brandId: '',
  categoryId: '',
  supplierId: '',
  costPrice: '',
  sellingPrice: '',
  currentStock: '',
  reorderLevel: '',
  condition: 'NEW',
};

export default function ProductForm({ brands, categories, suppliers = [], initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(() =>
    initial
      ? {
          partNumber: initial.partNumber,
          name: initial.name,
          description: initial.description || '',
          unit: initial.unit,
          brandId: String(initial.brandId),
          categoryId: initial.categoryId ? String(initial.categoryId) : '',
          supplierId: initial.supplierId ? String(initial.supplierId) : '',
          costPrice: initial.costPrice,
          sellingPrice: initial.sellingPrice,
          currentStock: initial.currentStock,
          reorderLevel: initial.reorderLevel,
          condition: initial.condition || 'NEW',
        }
      : emptyForm
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [partNumberTouched, setPartNumberTouched] = useState(!!initial);
  const requestIdRef = useRef(0);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handlePartNumberChange = (e) => {
    setPartNumberTouched(true);
    setForm({ ...form, partNumber: e.target.value });
  };

  const applySuggestion = () => {
    setPartNumberTouched(false);
    setForm({ ...form, partNumber: suggestion });
  };

  useEffect(() => {
    if (initial || !form.brandId) {
      setSuggestion('');
      return;
    }
    const requestId = ++requestIdRef.current;
    setSuggesting(true);
    suggestPartNumber(form.brandId, form.categoryId || undefined)
      .then(({ partNumber }) => {
        if (requestId !== requestIdRef.current) return;
        setSuggestion(partNumber);
        if (!partNumberTouched) setForm((f) => ({ ...f, partNumber }));
      })
      .catch(() => {})
      .finally(() => {
        if (requestId === requestIdRef.current) setSuggesting(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.brandId, form.categoryId, initial]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save part');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium text-muted">Part Number</label>
          {!initial && suggesting && (
            <span className="text-xs text-muted">Suggesting...</span>
          )}
          {!initial && !suggesting && suggestion && suggestion !== form.partNumber && (
            <button
              type="button"
              onClick={applySuggestion}
              className="text-xs font-medium text-amber-600 hover:underline dark:text-amber-400"
            >
              Use suggested: {suggestion}
            </button>
          )}
        </div>
        <input
          value={form.partNumber}
          onChange={handlePartNumberChange}
          className={inputClass}
          placeholder={!initial ? 'Select a brand to get a suggestion' : undefined}
          required
          disabled={!!initial}
        />
        {!initial && (
          <p className="mt-1 text-xs text-muted">
            Auto-suggested from brand &amp; category — feel free to edit it.
          </p>
        )}
      </div>

      <div>
        <label className={labelClass}>Name</label>
        <input value={form.name} onChange={handleChange('name')} className={inputClass} required />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Brand</label>
          <select value={form.brandId} onChange={handleChange('brandId')} className={inputClass} required>
            <option value="">Select brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Category</label>
          <select value={form.categoryId} onChange={handleChange('categoryId')} className={inputClass}>
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Condition</label>
          <select value={form.condition} onChange={handleChange('condition')} className={inputClass}>
            <option value="NEW">Brand New</option>
            <option value="RECONDITION">Recondition</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Supplier (optional)</label>
        <select value={form.supplierId} onChange={handleChange('supplierId')} className={inputClass}>
          <option value="">No usual supplier</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>{s.name}{s.company ? ` — ${s.company}` : ''}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted">Who you usually buy this part from — pre-fills the supplier when you stock it in.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Unit</label>
          <input value={form.unit} onChange={handleChange('unit')} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Cost Price (Rs.)</label>
          <input
            type="number"
            step="0.01"
            value={form.costPrice}
            onChange={handleChange('costPrice')}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Selling Price (Rs.)</label>
          <input
            type="number"
            step="0.01"
            value={form.sellingPrice}
            onChange={handleChange('sellingPrice')}
            className={inputClass}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {!initial && (
          <div>
            <label className={labelClass}>Opening Stock</label>
            <input
              type="number"
              value={form.currentStock}
              onChange={handleChange('currentStock')}
              className={inputClass}
            />
          </div>
        )}
        <div>
          <label className={labelClass}>Reorder Level</label>
          <input
            type="number"
            value={form.reorderLevel}
            onChange={handleChange('reorderLevel')}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          value={form.description}
          onChange={handleChange('description')}
          className={inputClass}
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
      </div>
    </form>
  );
}
