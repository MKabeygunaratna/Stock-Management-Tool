export default function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="group rounded-lg border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-2 text-muted">
        <Icon size={14} className="transition-transform group-hover:scale-110" />
        <p className="text-sm">{label}</p>
      </div>
      <p className={`mt-1 text-2xl font-semibold ${tone || 'text-foreground'}`}>{value}</p>
    </div>
  );
}
