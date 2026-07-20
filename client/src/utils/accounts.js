export const OVERDUE_DAYS = 30;

export const balanceTone = (balance) => {
  if (balance > 0) return 'text-red-600 dark:text-red-400';
  if (balance < 0) return 'text-emerald-600 dark:text-emerald-400';
  return 'text-muted';
};
