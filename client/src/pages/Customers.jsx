import { useEffect, useState, useCallback } from 'react';
import { Users2, Plus, Search, Receipt, Wallet, Scale } from 'lucide-react';
import { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } from '../api/customers.api';
import { recordPayment } from '../api/payments.api';
import { formatCurrency } from '../utils/currency';
import { useToast } from '../context/ToastContext';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';
import CustomerForm from '../components/forms/CustomerForm';
import RecordPaymentForm from '../components/forms/RecordPaymentForm';

const balanceTone = (balance) => {
  if (balance > 0) return 'text-red-600 dark:text-red-400';
  if (balance < 0) return 'text-emerald-600 dark:text-emerald-400';
  return 'text-muted';
};

export default function Customers() {
  const { showToast } = useToast();

  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [statementFor, setStatementFor] = useState(null);
  const [statement, setStatement] = useState(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const load = useCallback(() => {
    getCustomers({ page, search: search || undefined })
      .then((data) => {
        setCustomers(data.items);
        setTotalPages(data.totalPages);
      })
      .catch(() => setError('Failed to load customers'));
  }, [page, search]);

  useEffect(load, [load]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (customer) => {
    setEditing(customer);
    setModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    if (editing) {
      await updateCustomer(editing.id, payload);
      showToast('Customer updated');
    } else {
      await createCustomer(payload);
      showToast('Customer created');
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async () => {
    const res = await deleteCustomer(deleteTarget.id);
    showToast(res.message);
    setDeleteTarget(null);
    load();
  };

  const loadStatement = (customer) => {
    setStatementFor(customer);
    setStatement(null);
    setStatementLoading(true);
    getCustomer(customer.id)
      .then(setStatement)
      .catch(() => showToast('Failed to load customer statement', 'error'))
      .finally(() => setStatementLoading(false));
  };

  const handleRecordPayment = async (payload) => {
    await recordPayment({ ...payload, customerId: statementFor.id });
    showToast('Payment recorded');
    setPaymentModalOpen(false);
    loadStatement(statementFor);
    load();
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        icon={Users2}
        title="Customers"
        subtitle="Manage running credit accounts and dues"
        action={<Button onClick={openCreate}><Plus size={16} /> Add Customer</Button>}
      />

      <div className="relative max-w-sm">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          placeholder="Search by name, company, or phone"
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          className="w-full rounded-md border border-input bg-surface-muted py-2 pl-8 pr-3 text-sm text-foreground placeholder-muted focus:border-amber-500 focus:outline-none"
        />
      </div>

      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}

      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Company</th>
              <th className="px-4 py-2 font-medium">Phone</th>
              <th className="px-4 py-2 font-medium">Credit Limit</th>
              <th className="px-4 py-2 font-medium">Balance Owed</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-surface-muted/40">
                <td className="px-4 py-2 font-medium text-foreground">{c.name}</td>
                <td className="px-4 py-2 text-muted">{c.company || '-'}</td>
                <td className="px-4 py-2 text-muted">{c.phone || '-'}</td>
                <td className="px-4 py-2 text-muted">{c.creditLimit != null ? formatCurrency(c.creditLimit) : 'No limit'}</td>
                <td className={`px-4 py-2 font-medium ${balanceTone(c.balance)}`}>{formatCurrency(c.balance)}</td>
                <td className="px-4 py-2">
                  <button onClick={() => loadStatement(c)} className="mr-3 text-amber-500 hover:underline">Statement</button>
                  <button onClick={() => openEdit(c)} className="mr-3 text-amber-500 hover:underline">Edit</button>
                  <button onClick={() => setDeleteTarget(c)} className="text-red-600 dark:text-red-400 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <EmptyState icon={Users2} message="No customers found" />
                </td>
              </tr>
            )}
          </tbody>
        </table></div>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>

      <Modal open={modalOpen} title={editing ? 'Edit Customer' : 'Add Customer'} onClose={() => setModalOpen(false)}>
        <CustomerForm initial={editing} onSubmit={handleSubmit} onCancel={() => setModalOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        message={`Delete "${deleteTarget?.name}"? Customers with invoice or payment history will be disabled instead of deleted.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Modal open={!!statementFor} title={statementFor ? `${statementFor.name} — Statement` : ''} onClose={() => setStatementFor(null)} size="xl">
        {statementLoading && <Spinner label="Loading statement..." />}
        {!statementLoading && statement && (
          <div className="animate-fade-in space-y-5">
            <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-surface-muted p-4 sm:grid-cols-3">
              <div className="flex items-start gap-2.5">
                <Receipt size={16} className="mt-0.5 shrink-0 text-amber-500" />
                <div>
                  <p className="text-xs text-muted">Total Invoiced</p>
                  <p className="text-sm font-medium text-foreground">{formatCurrency(statement.totalInvoiced)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Wallet size={16} className="mt-0.5 shrink-0 text-amber-500" />
                <div>
                  <p className="text-xs text-muted">Total Paid</p>
                  <p className="text-sm font-medium text-foreground">{formatCurrency(statement.totalPaid)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Scale size={16} className={`mt-0.5 shrink-0 ${balanceTone(statement.balance)}`} />
                <div>
                  <p className="text-xs text-muted">Balance Owed</p>
                  <p className={`text-sm font-semibold ${balanceTone(statement.balance)}`}>{formatCurrency(statement.balance)}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">Ledger ({statement.ledger.length})</p>
              <div className="max-h-[22rem] overflow-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border text-left text-muted">
                      <th className="px-4 py-2.5 font-medium">Date</th>
                      <th className="px-4 py-2.5 font-medium">Reference</th>
                      <th className="px-4 py-2.5 font-medium">Debit</th>
                      <th className="px-4 py-2.5 font-medium">Credit</th>
                      <th className="px-4 py-2.5 font-medium">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statement.ledger.map((entry) => (
                      <tr key={`${entry.type}-${entry.id}`} className="border-b border-border/60 transition-colors last:border-0 hover:bg-surface-muted/40">
                        <td className="px-4 py-2.5 text-muted">{new Date(entry.date).toLocaleDateString()}</td>
                        <td className="px-4 py-2.5 text-foreground">
                          {entry.reference}
                          {entry.notes && <div className="text-xs text-muted">{entry.notes}</div>}
                        </td>
                        <td className="px-4 py-2.5 text-red-600 dark:text-red-400">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
                        <td className="px-4 py-2.5 text-emerald-600 dark:text-emerald-400">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
                        <td className="px-4 py-2.5 font-medium text-foreground">{formatCurrency(entry.balance)}</td>
                      </tr>
                    ))}
                    {statement.ledger.length === 0 && (
                      <tr>
                        <td colSpan={5}>
                          <EmptyState icon={Users2} message="No invoices or payments yet" />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-surface-muted p-4">
              <p className="text-base font-semibold text-foreground">Balance Owed: <span className={balanceTone(statement.balance)}>{formatCurrency(statement.balance)}</span></p>
              <Button type="button" variant="success" onClick={() => setPaymentModalOpen(true)}>
                Record Payment
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={paymentModalOpen} title="Record Payment" onClose={() => setPaymentModalOpen(false)} size="lg">
        <RecordPaymentForm onSubmit={handleRecordPayment} onCancel={() => setPaymentModalOpen(false)} />
      </Modal>
    </div>
  );
}
