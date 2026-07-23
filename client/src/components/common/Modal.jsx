import { createPortal } from "react-dom";
import { X } from "lucide-react";

const sizes = {
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export default function Modal({ open, title, onClose, children, size = "md" }) {
  if (!open) return null;

  // Rendered via portal directly under <body> — if nested in the page tree, an
  // ancestor mid-animation (e.g. animate-fade-in's transform) becomes this
  // element's containing block per the CSS transform spec, which breaks
  // `fixed` positioning and traps the overlay inside that ancestor instead of
  // covering the viewport.
  return createPortal(
    <div className="fixed inset-0 z-50 flex animate-overlay-in items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]">
      <div className={`flex w-full ${sizes[size] || sizes.md} max-h-[90vh] animate-scale-in flex-col rounded-2xl border border-border bg-card shadow-xl shadow-black/40`}>
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-lg font-semibold text-foreground">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-xl p-1 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
