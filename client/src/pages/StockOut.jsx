import { useEffect, useRef, useState } from 'react';
import { PackageMinus, FileSpreadsheet, Download } from 'lucide-react';
import { getProducts } from '../api/products.api';
import { getCustomers } from '../api/customers.api';
import { stockOut } from '../api/stock.api';
import { downloadInvoicePdf } from '../api/invoices.api';
import { formatCurrency } from '../utils/currency';
import { parseStockOutWorkbook, downloadStockOutTemplate } from '../utils/excelImport';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';

const inputClass =
  'w-full rounded-md border border-input bg-surface-muted px-3 py-2 text-sm text-foreground placeholder-muted focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500';
const labelClass = 'mb-1 block text-sm font-medium text-muted';

export default function StockOut() {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [search, setSearch] = useState('');
  const [options, setOptions] = useState([]);
  const [cart, setCart] = useState([]);

  const [buyerName, setBuyerName] = useState('');
  const [buyerCompany, setBuyerCompany] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const [customerSearch, setCustomerSearch] = useState('');
  const [customerOptions, setCustomerOptions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      getProducts({ search: search || undefined, limit: 20 })
        .then((data) => setOptions(data.items))
        .catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!customerSearch) {
      setCustomerOptions([]);
      return;
    }
    const timer = setTimeout(() => {
      getCustomers({ search: customerSearch, limit: 10 })
        .then((data) => setCustomerOptions(data.items))
        .catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setBuyerName(customer.name);
    setBuyerCompany(customer.company || '');
    setCustomerSearch('');
    setCustomerOptions([]);
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setBuyerName('');
    setBuyerCompany('');
  };

  const addToCart = (product, quantity = 1) => {
    setSearch('');
    setOptions([]);
    setCart((prev) => {
      const existing = prev.find((line) => line.product.id === product.id);
      if (existing) {
        return prev.map((line) =>
          line.product.id === product.id ? { ...line, quantity: line.quantity + quantity } : line
        );
      }
      return [...prev, { product, quantity }];
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
    setSelectedCustomer(null);
    setCustomerSearch('');
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      await downloadStockOutTemplate();
    } catch {
      showToast('Failed to generate the template file', 'error');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    setImporting(true);
    try {
      const rows = await parseStockOutWorkbook(file);
      if (rows.length === 0) {
        showToast('The file had no part rows to import', 'error');
        return;
      }

      let matched = 0;
      const notFound = [];
      const invalidQty = [];

      for (const row of rows) {
        if (!row.partNumber) continue;
        if (!row.quantity || row.quantity <= 0) {
          invalidQty.push(row.partNumber);
          continue;
        }
        const data = await getProducts({ search: row.partNumber, limit: 10 });
        const product = data.items.find(
          (p) => p.partNumber.toLowerCase() === row.partNumber.toLowerCase()
        );
        if (!product) {
          notFound.push(row.partNumber);
          continue;
        }
        addToCart(product, row.quantity);
        matched += 1;
      }

      const problems = [];
      if (notFound.length) problems.push(`${notFound.length} part number(s) not found: ${notFound.join(', ')}`);
      if (invalidQty.length) problems.push(`${invalidQty.length} row(s) had a missing/invalid quantity: ${invalidQty.join(', ')}`);

      if (matched > 0) showToast(`Imported ${matched} part${matched === 1 ? '' : 's'} from the file`);
      if (problems.length) setError(problems.join('. '));
      if (matched === 0 && problems.length === 0) showToast('No matching rows found in the file', 'error');
    } catch (err) {
      setError(err.message || 'Failed to read the uploaded file');
    } finally {
      setImporting(false);
    }
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
        customerId: selectedCustomer?.id,
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
    <div className="space-y-4 animate-fade-in">
      <PageHeader icon={PackageMinus} title="Stock Out" subtitle="Issue parts and generate an invoice" />

      <form onSubmit={handleConfirm} className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400 lg:col-span-3">
            {error}
          </div>
        )}

        <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className={labelClass}>Add Part</label>
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
                      onClick={() => addToCart(p)}
                      className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-surface-muted"
                    >
                      <span className="font-medium">{p.partNumber}</span> - {p.name}
                      <span className="ml-2 text-xs text-muted">({p.brand.name}, stock: {p.currentStock})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={importing}
                onClick={() => fileInputRef.current?.click()}
              >
                <FileSpreadsheet size={16} />
                {importing ? 'Importing...' : 'Upload Excel'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={downloadingTemplate}
                onClick={handleDownloadTemplate}
              >
                <Download size={16} />
                Template
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted">
            Excel file needs a <strong>Part Number</strong> column and a <strong>Qty</strong> column (or just
            part number in column A and quantity in column B). Not sure of the format? Download the{' '}
            <button
              type="button"
              onClick={handleDownloadTemplate}
              disabled={downloadingTemplate}
              className="text-amber-500 hover:underline"
            >
              template file
            </button>{' '}
            first. Matched rows are added to the cart below for review.
          </p>

          {cart.length > 0 && (
            <div className="rounded-md border border-border">
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted">
                    <th className="px-3 py-2 font-medium">Part</th>
                    <th className="px-3 py-2 font-medium">Qty</th>
                    <th className="px-3 py-2 font-medium">Unit Price</th>
                    <th className="px-3 py-2 font-medium">Line Total</th>
                    <th className="px-3 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((line) => (
                    <tr key={line.product.id} className="border-b border-border/60 last:border-0">
                      <td className="px-3 py-2 text-foreground">
                        {line.product.partNumber} - {line.product.name}
                        <div className="text-xs text-muted">Available: {line.product.currentStock} {line.product.unit}</div>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="1"
                          max={line.product.currentStock}
                          value={line.quantity}
                          onChange={(e) => updateQuantity(line.product.id, Number(e.target.value))}
                          className="w-20 rounded-md border border-input bg-surface-muted px-2 py-1 text-sm text-foreground focus:border-amber-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2 text-muted">{formatCurrency(line.product.sellingPrice)}</td>
                      <td className="px-3 py-2 text-muted">{formatCurrency(line.quantity * Number(line.product.sellingPrice))}</td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => removeLine(line.product.id)} className="text-red-600 dark:text-red-400 hover:underline">
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
              <div className="border-t border-border px-3 py-2 text-right text-sm font-semibold text-foreground">
                Grand Total: {formatCurrency(grandTotal)}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm lg:sticky lg:top-4">
          <div>
            <label className={labelClass}>Customer (optional)</label>
            {selectedCustomer ? (
              <div className="rounded-md border border-input bg-surface-muted px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{selectedCustomer.name}</span>
                  <button type="button" onClick={clearCustomer} className="text-xs text-amber-500 hover:underline">Change</button>
                </div>
                {selectedCustomer.company && <div className="text-xs text-muted">{selectedCustomer.company}</div>}
                <div className={`mt-1 text-xs font-medium ${selectedCustomer.balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted'}`}>
                  Current balance owed: {formatCurrency(selectedCustomer.balance)}
                </div>
              </div>
            ) : (
              <>
                <input
                  placeholder="Search customer for credit sale..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className={inputClass}
                />
                {customerSearch && customerOptions.length > 0 && (
                  <div className="mt-1 max-h-40 overflow-y-auto rounded-md border border-input bg-card shadow-lg">
                    {customerOptions.map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => selectCustomer(c)}
                        className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-surface-muted"
                      >
                        {c.name}{c.company ? ` (${c.company})` : ''}
                        <span className="ml-2 text-xs text-muted">owes {formatCurrency(c.balance)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <div>
            <label className={labelClass}>Buyer Name</label>
            <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className={inputClass} required disabled={!!selectedCustomer} />
          </div>
          <div>
            <label className={labelClass}>Buyer Company (optional)</label>
            <input value={buyerCompany} onChange={(e) => setBuyerCompany(e.target.value)} className={inputClass} disabled={!!selectedCustomer} />
          </div>
          <div>
            <label className={labelClass}>Reference (invoice/PO number)</label>
            <input value={reference} onChange={(e) => setReference(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Notes</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
          </div>

          <div className="border-t border-border pt-4 text-sm text-muted">
            <div className="flex justify-between">
              <span>Items</span>
              <span className="text-foreground">{cart.length}</span>
            </div>
            <div className="mt-1 flex justify-between font-medium">
              <span>Grand Total</span>
              <span className="text-foreground">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <Button type="submit" variant="danger" disabled={submitting} className="w-full">
            {submitting ? 'Processing...' : 'Confirm Stock Out & Generate Invoice'}
          </Button>
        </div>
      </form>
    </div>
  );
}
