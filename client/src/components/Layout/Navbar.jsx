import { useNavigate } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Button from "../common/Button";
import ThemeToggle from "../ThemeToggle";
import NotificationBell from "./NotificationBell";
import logo from "../../assets/logo.svg";

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = user?.fullName
    ?.split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-3 sm:px-6">
      <div className="flex items-center gap-2.5">
        <button
          onClick={onMenuClick}
          className="mr-1 rounded-xl p-1.5 text-muted hover:bg-surface-muted md:hidden"
        >
          <Menu size={20} />
        </button>
        <img
          src={logo}
          alt="Nihon Auto Enterprises"
          className="h-9 w-auto rounded-xl bg-white px-1.5 py-1"
        />
        <span className="hidden font-semibold text-foreground sm:inline">
          Spare Parts Inventory
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm sm:gap-3">
        <div className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 sm:bg-surface-muted">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 text-xs font-semibold text-amber-600 dark:text-amber-400">
            {initials}
          </span>
          <span className="hidden text-muted sm:inline">
            {user?.fullName}{" "}
            <span className="text-muted opacity-70">({user?.role})</span>
          </span>
        </div>
        <NotificationBell />
        <ThemeToggle />
        <Button
          variant="secondary"
          onClick={handleLogout}
          className="px-2 py-1.5 sm:px-3"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
