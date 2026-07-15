import { useState } from 'react';
import Button from '../common/Button';

const inputClass =
  'w-full rounded-md border border-input bg-surface-muted px-3 py-2 text-sm text-foreground placeholder-muted focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500';
const labelClass = 'mb-1 block text-sm font-medium text-muted';

export default function NewPurchaseItemForm({ onSubmit, onCancel }) {
  const [name, setName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [brandName, setBrandName] = useState('');
  const [condition, setCondition] = useState('NEW');
  const [quantity, setQuantity] = useState(1);
  const [estimatedCost, setEstimatedCost] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!quantity || quantity <= 0) {
      setError('Enter a valid quantity');
      return;
    }
    onSubmit({
      name: name.trim(),
      partNumber: partNumber.trim() || undefined,
      brandName: brandName.trim() || undefined,
      condition,
      quantity: Number(quantity),
      estimatedCost: Number(estimatedCost) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      <div>
        <label className={labelClass}>Part Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required autoFocus />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Part Number (optional)</label>
          <input value={partNumber} onChange={(e) => setPartNumber(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Brand (optional)</label>
          <input value={brandName} onChange={(e) => setBrandName(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Condition</label>
        <select value={condition} onChange={(e) => setCondition(e.target.value)} className={inputClass}>
          <option value="NEW">Brand New</option>
          <option value="RECONDITION">Recondition</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Quantity</label>
          <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>Est. Unit Cost (optional)</label>
          <input type="number" min="0" step="0.01" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Add Item</Button>
      </div>
    </form>
  );
}
