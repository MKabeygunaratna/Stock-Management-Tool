import { Loader2 } from 'lucide-react';

export default function Spinner({ label, size = 20 }) {
  return (
    <div className="flex animate-fade-in items-center justify-center gap-2 py-8 text-muted">
      <Loader2 size={size} className="animate-spin text-amber-500" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
