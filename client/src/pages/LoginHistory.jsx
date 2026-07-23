import { useEffect, useState, useCallback } from 'react';
import { KeyRound, CheckCircle2, XCircle } from 'lucide-react';
import { getLoginLogs } from '../api/loginLogs.api';
import Pagination from '../components/common/Pagination';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';

const selectClass = 'rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground focus:border-amber-500 focus:outline-none';

export default function LoginHistory() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    getLoginLogs({ page, success: success || undefined })
      .then((data) => {
        setItems(data.items);
        setTotalPages(data.totalPages);
      })
      .catch(() => setError('Failed to load login history'));
  }, [page, success]);

  useEffect(load, [load]);

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader icon={KeyRound} title="Login History" subtitle="Who signed in, when, and from where" />

      <div className="flex flex-wrap gap-3">
        <select value={success} onChange={(e) => { setPage(1); setSuccess(e.target.value); }} className={selectClass}>
          <option value="">All Attempts</option>
          <option value="true">Successful</option>
          <option value="false">Failed</option>
        </select>
      </div>

      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">User</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">IP Address</th>
              <th className="px-4 py-2 font-medium">MAC Address</th>
            </tr>
          </thead>
          <tbody>
            {items.map((log) => (
              <tr key={log.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-surface-muted/40">
                <td className="px-4 py-2 text-muted">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2 text-foreground">
                  {log.username}
                  {log.user?.fullName && <div className="text-xs text-muted">{log.user.fullName}</div>}
                </td>
                <td className="px-4 py-2">
                  {log.success ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={14} /> Success
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                      <XCircle size={14} /> Failed
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-muted">{log.ipAddress || '—'}</td>
                <td className="px-4 py-2 text-muted">{log.macAddress || '—'}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <EmptyState icon={KeyRound} message="No login attempts recorded yet" />
                </td>
              </tr>
            )}
          </tbody>
        </table></div>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>

      <p className="text-xs text-muted">
        MAC addresses can only be resolved when the signing-in device is on the same local network as this server — they'll show as "—" for anyone connecting over the internet or from a different network.
      </p>
    </div>
  );
}
