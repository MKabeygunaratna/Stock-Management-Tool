import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getLowStockProducts } from '../api/products.api';
import PageHeader from '../components/common/PageHeader';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/common/Button';

export default function Notifications() {
  const { user } = useAuth();
  const enabled = user?.notificationsEnabled !== false;
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getLowStockProducts()
      .then((data) => setItems(data.items))
      .finally(() => setLoading(false));
  }, [enabled]);

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        icon={Bell}
        title="Notifications"
        subtitle="All alerts that need your attention"
        action={
          <Button variant="secondary" onClick={() => navigate('/settings')}>
            <SettingsIcon size={16} /> Notification settings
          </Button>
        }
      />

      <div className="rounded-lg border border-border bg-card shadow-sm">
        {!enabled ? (
          <EmptyState
            icon={Bell}
            message="Notifications are turned off"
            action={
              <Button onClick={() => navigate('/settings')}>
                <SettingsIcon size={16} /> Turn on in Settings
              </Button>
            }
          />
        ) : loading ? (
          <Spinner label="Loading notifications..." />
        ) : items.length === 0 ? (
          <EmptyState icon={Bell} message="All stock levels look healthy. No notifications." />
        ) : (
          <ul className="divide-y divide-border/60">
            {items.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => navigate('/products?lowStock=true')}
                  className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-muted/40"
                >
                  <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-500" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      Low stock: {p.name}
                    </span>
                    <span className="text-xs text-muted">
                      {p.brand.name}
                      {p.category?.name ? ` · ${p.category.name}` : ''} &middot; {p.currentStock}/{p.reorderLevel} {p.unit} remaining
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
