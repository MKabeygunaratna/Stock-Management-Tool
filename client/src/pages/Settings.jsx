import { useState } from 'react';
import { Settings as SettingsIcon, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/common/PageHeader';

export default function Settings() {
  const { user, setNotificationsEnabled } = useAuth();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const enabled = user?.notificationsEnabled !== false;

  const handleToggle = async () => {
    setSaving(true);
    try {
      await setNotificationsEnabled(!enabled);
      showToast(!enabled ? 'Notifications enabled' : 'Notifications disabled');
    } catch {
      showToast('Failed to update notification setting', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4 animate-fade-in">
      <PageHeader icon={SettingsIcon} title="Settings" subtitle="Manage your account preferences" />

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Bell size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              <p className="mt-0.5 text-sm text-muted">
                Show low stock alerts on the bell icon and Notifications page.
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={handleToggle}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-50 ${
              enabled ? 'bg-amber-500' : 'bg-surface-muted border border-input'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
