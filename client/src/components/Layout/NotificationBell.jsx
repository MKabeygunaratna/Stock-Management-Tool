import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle } from 'lucide-react';
import { getLowStockProducts } from '../../api/products.api';
import { useAuth } from '../../context/AuthContext';

const POLL_MS = 90000;

export default function NotificationBell() {
  const { user } = useAuth();
  const enabled = user?.notificationsEnabled !== false;
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      return;
    }
    let cancelled = false;
    const load = () => {
      getLowStockProducts()
        .then((data) => { if (!cancelled) setItems(data.items); })
        .catch(() => {});
    };
    load();
    const timer = setInterval(load, POLL_MS);
    return () => { cancelled = true; clearInterval(timer); };
  }, [enabled]);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const count = enabled ? items.length : 0;
  const goToNotifications = () => {
    setOpen(false);
    navigate('/notifications');
  };
  const goToSettings = () => {
    setOpen(false);
    navigate('/settings');
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative inline-flex items-center justify-center rounded-md p-2 text-muted hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Bell size={18} className={count > 0 ? 'animate-ring' : ''} />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] animate-pop items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-card">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 origin-top-right animate-scale-in rounded-lg border border-border bg-card shadow-xl shadow-black/20">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Low Stock Alerts</h3>
            {enabled && <span className="text-xs text-muted">{count} item{count === 1 ? '' : 's'}</span>}
          </div>
          {!enabled ? (
            <div className="px-4 py-6 text-center text-sm text-muted">
              Notifications are turned off.
              <button
                type="button"
                onClick={goToSettings}
                className="mt-2 block w-full font-medium text-amber-500 hover:underline"
              >
                Enable in Settings
              </button>
            </div>
          ) : (
            <>
              <div className="max-h-80 overflow-y-auto">
                {count === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-muted">All stock levels look healthy.</p>
                )}
                {items.slice(0, 20).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={goToNotifications}
                    className="flex w-full items-start gap-2 border-b border-border/60 px-4 py-2.5 text-left last:border-0 hover:bg-surface-muted/60"
                  >
                    <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-500" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{p.name}</span>
                      <span className="text-xs text-muted">{p.brand.name} &middot; {p.currentStock}/{p.reorderLevel} {p.unit}</span>
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={goToNotifications}
                className="block w-full border-t border-border px-4 py-2.5 text-center text-sm font-medium text-amber-500 hover:bg-surface-muted/60"
              >
                View all notifications
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
