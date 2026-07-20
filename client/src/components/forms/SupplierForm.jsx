import { useState } from 'react';
import Button from '../common/Button';

const inputClass =
  'w-full rounded-md border border-input bg-surface-muted px-3 py-2 text-sm text-foreground placeholder-muted focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50';
const labelClass = 'mb-1 block text-sm font-medium text-muted';

export default function SupplierForm({ initial, onSubmit, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [company, setCompany] = useState(initial?.company || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [address, setAddress] = useState(initial?.address || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onSubmit({
        name,
        company: company || undefined,
        phone: phone || undefined,
        address: address || undefined,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save supplier');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400 animate-shake">{error}</div>
      )}

      <div>
        <label className={labelClass}>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required autoFocus />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Company (optional)</label>
          <input value={company} onChange={(e) => setCompany(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Phone (optional)</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Address (optional)</label>
        <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
      </div>
    </form>
  );
}
