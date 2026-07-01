import { useNavigate } from 'react-router-dom';
import { Wrench, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.fullName
    ?.split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-3 sm:px-6">
      <div className="flex items-center gap-2">
        <button onClick={onMenuClick} className="mr-1 rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 md:hidden">
          <Menu size={20} />
        </button>
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/10 text-amber-500">
          <Wrench size={16} />
        </span>
        <span className="hidden font-semibold text-zinc-100 sm:inline">Spare Parts Inventory</span>
      </div>
      <div className="flex items-center gap-2 text-sm sm:gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300">
            {initials}
          </span>
          <span className="hidden text-zinc-400 sm:inline">
            {user?.fullName} <span className="text-zinc-600">({user?.role})</span>
          </span>
        </div>
        <Button variant="secondary" onClick={handleLogout} className="px-2 py-1.5 sm:px-3">
          <LogOut size={14} />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
