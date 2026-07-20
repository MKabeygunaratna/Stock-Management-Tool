import { X } from "lucide-react";

const sizes = {
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export default function Modal({ open, title, onClose, children, size = "md" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex animate-overlay-in items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]">
      <div className={`w-full ${sizes[size] || sizes.md} animate-scale-in rounded-lg border border-border bg-card p-6 shadow-xl shadow-black/40`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
