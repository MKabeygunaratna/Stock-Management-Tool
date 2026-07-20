import { useState } from 'react';
import Button from '../common/Button';

const inputClass =
  'w-full rounded-md border border-input bg-surface-muted px-3 py-2 text-sm text-foreground placeholder-muted focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500';
const labelClass = 'mb-1 block text-sm font-medium text-muted';

export default function RecordPaymentForm({ onSubmit, onCancel }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!amount || Number(amount) <= 0) {
      setError('Enter a valid payment amount');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        amount: Number(amount),
        method: method || undefined,
        reference: reference || undefined,
        notes: notes || undefined,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Amount (Rs.)</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClass}
            required
            autoFocus
          />
        </div>
        <div>
          <label className={labelClass}>Method</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputClass}>
            <option>Cash</option>
            <option>Bank Transfer</option>
            <option>Cheque</option>
            <option>Card</option>
            <option>Other</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Reference (optional)</label>
        <input value={reference} onChange={(e) => setReference(e.target.value)} className={inputClass} placeholder="Cheque #, transaction ID..." />
      </div>

      <div>
        <label className={labelClass}>Notes (optional)</label>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="success" disabled={submitting}>{submitting ? 'Recording...' : 'Record Payment'}</Button>
      </div>
    </form>
  );
}
