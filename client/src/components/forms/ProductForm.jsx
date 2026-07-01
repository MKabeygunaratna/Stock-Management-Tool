import { useState } from 'react';
import Button from '../common/Button';

const inputClass =
  'w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50';
const labelClass = 'mb-1 block text-sm font-medium text-zinc-300';

const emptyForm = {
  partNumber: '',
  name: '',
  description: '',
  unit: 'pcs',
  brandId: '',
  categoryId: '',
  costPrice: '',
  sellingPrice: '',
  currentStock: '',
  reorderLevel: '',
};

export default function ProductForm({ brands, categories, initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(() =>
    initial
      ? {
          partNumber: initial.partNumber,
          name: initial.name,
          description: initial.description || '',
          unit: initial.unit,
          brandId: String(initial.brandId),
          categoryId: initial.categoryId ? String(initial.categoryId) : '',
          costPrice: initial.costPrice,
          sellingPrice: initial.sellingPrice,
          currentStock: initial.currentStock,
          reorderLevel: initial.reorderLevel,
        }
      : emptyForm
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

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
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>
      )}

      <div>
        <label className={labelClass}>Part Number</label>
        <input
          value={form.partNumber}
          onChange={handleChange('partNumber')}
          className={inputClass}
          required
          disabled={!!initial}
        />
      </div>

      <div>
        <label className={labelClass}>Name</label>
        <input value={form.name} onChange={handleChange('name')} className={inputClass} required />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
