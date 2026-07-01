const variants = {
  primary: 'bg-amber-500 text-zinc-950 hover:bg-amber-400 focus-visible:ring-amber-500',
  secondary: 'border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 focus-visible:ring-zinc-500',
  danger: 'bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500',
  success: 'bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-emerald-500',
  ghost: 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800',
};

export default function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
