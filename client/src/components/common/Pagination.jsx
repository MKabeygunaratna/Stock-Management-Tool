import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
      <span className="text-muted">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="flex items-center gap-1 rounded-md border border-input px-3 py-1 text-muted hover:bg-surface-muted disabled:opacity-40"
        >
          <ChevronLeft size={14} /> Previous
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="flex items-center gap-1 rounded-md border border-input px-3 py-1 text-muted hover:bg-surface-muted disabled:opacity-40"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
