import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, message = 'Nothing here yet', action }) {
  return (
    <div className="flex animate-fade-in flex-col items-center justify-center gap-3 py-10 text-muted">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-muted">
        <Icon size={22} className="text-muted opacity-70" />
      </span>
      <p className="text-sm">{message}</p>
      {action}
    </div>
  );
}
