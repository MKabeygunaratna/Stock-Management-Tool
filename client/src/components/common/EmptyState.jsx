import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, message = 'Nothing here yet' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-zinc-500">
      <Icon size={28} className="text-zinc-700" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
