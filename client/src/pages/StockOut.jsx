import { useEffect, useState } from 'react';
import { PackageMinus } from 'lucide-react';
import { getProducts } from '../api/products.api';
import { stockOut } from '../api/stock.api';
import { downloadInvoicePdf } from '../api/invoices.api';
import { formatCurrency } from '../utils/currency';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';

const inputClass =
  'w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500';
const labelClass = 'mb-1 block text-sm font-medium text-zinc-300';

export default function StockOut() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState([]);
  const [cart, setCart] = useState([]);

  const [buyerName, setBuyerName] = useState('');
  const [buyerCompany, setBuyerCompany] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

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

  const addToCart = (product) => {
    setSearch('');
    setOptions([]);
    setCart((prev) => {
      const existing = prev.find((line) => line.product.id === product.id);
      if (existing) {
        return prev.map((line) =>
          line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, quantity) => {
    setCart((prev) => prev.map((line) => (line.product.id === productId ? { ...line, quantity } : line)));
  };

  const removeLine = (productId) => {
    setCart((prev) => prev.filter((line) => line.product.id !== productId));
  };

  const grandTotal = cart.reduce((sum, line) => sum + line.quantity * Number(line.product.sellingPrice), 0);

  const resetForm = () => {
    setCart([]);
    setBuyerName('');
    setBuyerCompany('');
    setReference('');
    setNotes('');
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError('');

    if (!buyerName) {
      setError('Buyer name is required');
      return;
    }
    if (cart.length === 0) {
      setError('Add at least one part to the cart');
      return;
    }
    for (const line of cart) {
      if (!line.quantity || line.quantity <= 0) {
        setError(`Enter a valid quantity for ${line.product.name}`);
        return;
      }
      if (line.quantity > line.product.currentStock) {
        setError(`Only ${line.product.currentStock} ${line.product.unit} of ${line.product.name} available`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const invoice = await stockOut({
        buyerName,
        buyerCompany,
        reference,
        notes,
        items: cart.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
      });
      showToast(`Invoice ${invoice.invoiceNumber} created. Downloading PDF...`);
      await downloadInvoicePdf(invoice.id, invoice.invoiceNumber);
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record stock out');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader icon={PackageMinus} title="Stock Out" subtitle="Issue parts and generate an invoice" />

      <form onSubmit={handleConfirm} className="max-w-2xl space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-sm">
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>
        )}

        <div>
          <label className={labelClass}>Add Part</label>
          <input
            placeholder="Search by name or part number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputClass}
          />
          {search && options.length > 0 && (
            <div className="mt-1 max-h-48 overflow-y-auto rounded-md border border-zinc-700 bg-zinc-900 shadow-lg">
              {options.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="block w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800"
                >
                  <span className="font-medium">{p.partNumber}</span> - {p.name}
                  <span className="ml-2 text-xs text-zinc-500">({p.brand.name}, stock: {p.currentStock})</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="rounded-md border border-zinc-800">
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-zinc-500">
                  <th className="px-3 py-2 font-medium">Part</th>
                  <th className="px-3 py-2 font-medium">Qty</th>
                  <th className="px-3 py-2 font-medium">Unit Price</th>
                  <th className="px-3 py-2 font-medium">Line Total</th>
                  <th className="px-3 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((line) => (
                  <tr key={line.product.id} className="border-b border-zinc-800/60 last:border-0">
                    <td className="px-3 py-2 text-zinc-100">
                      {line.product.partNumber} - {line.product.name}
                      <div className="text-xs text-zinc-500">Available: {line.product.currentStock} {line.product.unit}</div>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="1"
                        max={line.product.currentStock}
                        value={line.quantity}
                        onChange={(e) => updateQuantity(line.product.id, Number(e.target.value))}
                        className="w-20 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2 text-zinc-300">{formatCurrency(line.product.sellingPrice)}</td>
                    <td className="px-3 py-2 text-zinc-300">{formatCurrency(line.quantity * Number(line.product.sellingPrice))}</td>
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => removeLine(line.product.id)} className="text-red-400 hover:underline">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            <div className="border-t border-zinc-800 px-3 py-2 text-right text-sm font-semibold text-zinc-100">
              Grand Total: {formatCurrency(grandTotal)}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Buyer Name</label>
            <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Buyer Company (optional)</label>
            <input value={buyerCompany} onChange={(e) => setBuyerCompany(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Reference (invoice/PO number)</label>
            <input value={reference} onChange={(e) => setReference(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Notes</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
          </div>
        </div>

        <Button type="submit" variant="danger" disabled={submitting} className="w-full">
          {submitting ? 'Processing...' : 'Confirm Stock Out & Generate Invoice'}
        </Button>
      </form>
    </div>
  );
}
