import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, message = 'Nothing here yet', action }) {
  return (
    <div className="flex animate-fade-in flex-col items-center justify-center gap-3 py-10 text-muted">
      <Icon size={28} className="text-muted opacity-70" />
      <p className="text-sm">{message}</p>
      {action}
    </div>
  );
}
