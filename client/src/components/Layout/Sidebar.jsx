import { NavLink } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Parts', icon: Package },
  { to: '/stock-in', label: 'Stock In', icon: PackagePlus },
  { to: '/stock-out', label: 'Stock Out', icon: PackageMinus },
  { to: '/stock-history', label: 'Stock History', icon: History },
  { to: '/invoices', label: 'Invoices', icon: Receipt },
];

const adminItems = [
  { to: '/brands', label: 'Brands', icon: Tag },
  { to: '/categories', label: 'Categories', icon: Layers },
  { to: '/users', label: 'Users', icon: UsersIcon },
];

function NavItem({ to, end, label, icon: Icon, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-md border-l-2 px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'border-amber-500 bg-amber-500/10 text-amber-400'
            : 'border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
        }`
      }
    >
      <Icon size={16} />
      {label}
    </NavLink>
  );
}

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-56 shrink-0 border-r border-zinc-800 bg-zinc-900 p-4 transition-transform md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} onNavigate={onClose} />
          ))}
          {isAdmin && (
            <>
              <div className="pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-600">Admin</div>
              {adminItems.map((item) => (
                <NavItem key={item.to} {...item} onNavigate={onClose} />
              ))}
            </>
          )}
        </nav>
      </aside>
    </>
  );
}
