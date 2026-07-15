import { X } from "lucide-react";

export default function Modal({ open, title, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl shadow-black/40">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
