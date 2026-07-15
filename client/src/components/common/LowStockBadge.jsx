export default function LowStockBadge({ currentStock, reorderLevel }) {
  if (currentStock > reorderLevel) return null;

  return (
    <span className="ml-2 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
      Low stock
    </span>
  );
}
