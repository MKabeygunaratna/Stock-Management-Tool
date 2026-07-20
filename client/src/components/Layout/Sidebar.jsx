import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  PackagePlus,
  PackageMinus,
  History,
  Receipt,
  Tag,
  Layers,
  Users as UsersIcon,
  Users2,
  Wallet,
  ShoppingCart,
  Truck,
  AlertTriangle,
  Scale,
  TrendingUp,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { to: "/", end: true, label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Parts", icon: Package },
  { to: "/stock-in", label: "Stock In", icon: PackagePlus },
  { to: "/stock-out", label: "Stock Out", icon: PackageMinus },
  { to: "/stock-history", label: "Stock History", icon: History },
  { to: "/invoices", label: "Invoices", icon: Receipt },
  { to: "/purchases", label: "Purchases", icon: ShoppingCart },
  { to: "/customers", label: "Customers", icon: Users2 },
  { to: "/suppliers", label: "Suppliers", icon: Truck },
];

const accountItems = [
  { to: "/accounts", end: true, label: "Overview", icon: Wallet },
  { to: "/accounts/overdue", label: "Overdue Payments", icon: AlertTriangle },
  { to: "/accounts/outstanding", label: "Receivables & Payables", icon: Scale },
  { to: "/accounts/invoices", label: "Profit & Loss", icon: TrendingUp },
];

const adminItems = [
  { to: "/brands", label: "Brands", icon: Tag },
  { to: "/categories", label: "Categories", icon: Layers },
  { to: "/users", label: "Users", icon: UsersIcon },
];

function isItemActive(pathname, item) {
  return item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);
}

function NavItem({ to, end, label, icon: Icon, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group flex items-center gap-2.5 rounded-md border-l-2 px-3 py-2 text-sm font-medium transition-all duration-150 ${
          isActive
            ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
            : "border-transparent text-muted hover:translate-x-0.5 hover:bg-surface-muted hover:text-foreground"
        }`
      }
    >
      <Icon size={16} className="shrink-0 transition-transform duration-150 group-hover:scale-110" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

function NavGroup({ label, icon: Icon, items, onNavigate }) {
  const location = useLocation();
  const hasActiveChild = items.some((item) => isItemActive(location.pathname, item));
  const [open, setOpen] = useState(hasActiveChild);

  // Keep the group expanded whenever navigation lands on one of its children
  // (e.g. the drill-down link from the Accounts chart into Profit & Loss).
  useEffect(() => {
    if (hasActiveChild) setOpen(true);
  }, [hasActiveChild]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
          hasActiveChild ? "text-amber-600 dark:text-amber-400" : "text-muted hover:bg-surface-muted hover:text-foreground"
        }`}
      >
        <span className="flex items-center gap-2.5">
          <Icon size={16} className="shrink-0" />
          {label}
        </span>
        <ChevronDown size={14} className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="animate-fade-in space-y-1 py-1 pl-4">
          {items.map((item) => (
            <NavItem key={item.to} {...item} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 animate-overlay-in bg-black/60 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 max-w-[85vw] shrink-0 flex-col border-r border-border bg-card/95 shadow-sm transition-transform duration-300 ease-out md:static md:max-w-none md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} onNavigate={onClose} />
          ))}
          {isAdmin && (
            <div className="space-y-1 pt-2">
              <NavGroup label="Accounts" icon={Wallet} items={accountItems} onNavigate={onClose} />
              <NavGroup label="Admin" icon={ShieldCheck} items={adminItems} onNavigate={onClose} />
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}
