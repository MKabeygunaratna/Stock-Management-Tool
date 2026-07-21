import { useEffect, useState } from 'react';
import { Receipt, Landmark, Scale } from 'lucide-react';
import { getCustomer } from '../../api/customers.api';
import { getSupplier } from '../../api/suppliers.api';
import { recordPayment } from '../../api/payments.api';
import { recordSupplierPayment } from '../../api/supplierPayments.api';
import { formatCurrency } from '../../utils/currency';
import { balanceTone } from '../../utils/accounts';
import { useToast } from '../../context/ToastContext';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import EmptyState from '../common/EmptyState';
import RecordPaymentForm from '../forms/RecordPaymentForm';

/**
 * target: { type: 'customer' | 'supplier', id, name } | null
 * onChanged: called after a payment is recorded, so the caller can refresh its own list/totals.
 */
export default function AccountLedgerModal({ target, onClose, onChanged }) {
  const { showToast } = useToast();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const load = () => {
    if (!target) return;
    setDetail(null);
    setLoading(true);
    const fetcher = target.type === 'customer' ? getCustomer(target.id) : getSupplier(target.id);
    fetcher
      .then(setDetail)
      .catch(() => showToast('Failed to load statement', 'error'))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [target?.type, target?.id]);

  const handleRecordPayment = async (payload) => {
    if (target.type === 'customer') {
      await recordPayment({ ...payload, customerId: target.id });
    } else {
      await recordSupplierPayment({ ...payload, supplierId: target.id });
    }
    showToast('Payment recorded');
    setPaymentModalOpen(false);
    load();
    onChanged?.();
  };

  return (
    <>
      <Modal open={!!target} title={target ? `${target.name} — Statement` : ''} onClose={onClose} size="xl">
        {loading && <Spinner label="Loading statement..." />}
        {!loading && detail && (
          <div className="animate-fade-in space-y-5">
            <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-surface-muted p-4 sm:grid-cols-3">
              <div className="flex items-start gap-2.5">
                <Receipt size={16} className="mt-0.5 shrink-0 text-amber-500" />
                <div>
                  <p className="text-xs text-muted">{target.type === 'customer' ? 'Total Invoiced' : 'Total Credit Stock-Ins'}</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatCurrency(target.type === 'customer' ? detail.totalInvoiced : detail.totalCredit)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Landmark size={16} className="mt-0.5 shrink-0 text-amber-500" />
                <div>
                  <p className="text-xs text-muted">Total Paid</p>
                  <p className="text-sm font-medium text-foreground">{formatCurrency(detail.totalPaid)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Scale size={16} className={`mt-0.5 shrink-0 ${balanceTone(detail.balance)}`} />
                <div>
                  <p className="text-xs text-muted">Balance</p>
                  <p className={`text-sm font-semibold ${balanceTone(detail.balance)}`}>{formatCurrency(detail.balance)}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">Ledger ({detail.ledger.length})</p>
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
                    {detail.ledger.map((entry) => (
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
                    {detail.ledger.length === 0 && (
                      <tr>
                        <td colSpan={5}>
                          <EmptyState icon={Receipt} message="No activity yet" />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-surface-muted p-4">
              <p className="text-base font-semibold text-foreground">Balance: <span className={balanceTone(detail.balance)}>{formatCurrency(detail.balance)}</span></p>
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
    </>
  );
}
