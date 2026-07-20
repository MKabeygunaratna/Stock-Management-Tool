export default function PageHeader({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="flex h-9 w-9 animate-scale-in items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-500/5 text-amber-500">
            <Icon size={18} />
          </span>
        )}
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}
