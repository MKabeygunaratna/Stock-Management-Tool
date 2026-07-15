const variants = {
  primary:
    "bg-amber-500 text-zinc-950 shadow-sm shadow-amber-500/20 hover:bg-amber-400 focus-visible:ring-amber-500",
  secondary:
    "border border-input bg-surface-muted text-foreground shadow-sm hover:bg-border focus-visible:ring-muted",
  danger:
    "bg-red-600 text-white shadow-sm hover:bg-red-500 focus-visible:ring-red-500",
  success:
    "bg-emerald-600 text-white shadow-sm hover:bg-emerald-500 focus-visible:ring-emerald-500",
  ghost:
    "text-muted hover:bg-surface-muted hover:text-foreground",
};

export default function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
