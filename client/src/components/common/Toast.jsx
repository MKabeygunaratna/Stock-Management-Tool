import { CheckCircle2, XCircle, X } from 'lucide-react';

const styles = {
  success: { border: 'border-emerald-500/40', icon: <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" /> },
  error: { border: 'border-red-500/40', icon: <XCircle size={18} className="text-red-600 dark:text-red-400" /> },
};

export default function Toast({ message, type = 'success', onDismiss }) {
  const style = styles[type] || styles.success;

  return (
    <div
      className={`flex w-80 items-start gap-2 rounded-md border ${style.border} bg-card px-4 py-3 text-sm text-foreground shadow-lg shadow-black/30`}
    >
      {style.icon}
      <p className="flex-1">{message}</p>
      <button onClick={onDismiss} className="text-muted hover:text-muted">
        <X size={16} />
      </button>
    </div>
  );
}
