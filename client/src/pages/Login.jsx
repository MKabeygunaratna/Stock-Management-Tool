import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { TrendingUp, ShieldCheck, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Button from "../components/common/Button";
import SplashScreen from "../components/common/SplashScreen";
import ThemeToggle from "../components/ThemeToggle";
import logo from "../assets/logo.svg";

const stockBars = [45, 65, 55, 80, 70, 95];

const highlights = [
  { icon: Zap, text: "Real-time stock levels across every branch" },
  { icon: ShieldCheck, text: "Role-based access for admins and staff" },
];

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <SplashScreen label="Checking session..." />;
  }

  if (signedIn) {
    return <SplashScreen label="Welcome back, loading your dashboard..." />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(username, password);
      setSignedIn(true);
      setTimeout(() => navigate("/"), 1800);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background lg:grid lg:grid-cols-2">
      <ThemeToggle className="absolute right-4 top-4 z-10" />

      <div className="flex w-full flex-col items-center justify-center px-6 py-12 sm:px-10">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm animate-scale-in"
        >
          <div className="mb-8 flex flex-col items-center text-center">
            <img
              src={logo}
              alt="Nihon Auto Enterprises"
              className="mb-6 h-16 w-auto rounded-xl bg-white px-3 py-2 shadow-sm shadow-black/10"
            />
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-muted">
              Sign in to your Spare Parts Inventory dashboard
            </p>
          </div>

          {error && (
            <div className="mb-6 animate-shake rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">
                Username
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full rounded-xl border border-input bg-surface-muted/50 px-4 py-3 text-sm text-foreground placeholder-muted transition-colors duration-150 focus:border-amber-500 focus:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-input bg-surface-muted/50 px-4 py-3 text-sm text-foreground placeholder-muted transition-colors duration-150 focus:border-amber-500 focus:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full bg-gradient-to-r from-amber-500 to-amber-600 py-3 font-semibold hover:from-amber-600 hover:to-amber-700 disabled:from-zinc-300 disabled:to-zinc-400 dark:disabled:from-zinc-600 dark:disabled:to-zinc-700"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </div>

          <p className="mt-8 text-center text-xs text-muted">
            © {new Date().getFullYear()} Nihon Auto Enterprises. All rights
            reserved.
          </p>
        </form>
      </div>

      <div className="relative hidden overflow-hidden bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-black/10 blur-3xl" />

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-bold leading-tight text-white">
            Every part accounted for, everywhere.
          </h2>
          <div className="mt-6 space-y-3">
            {highlights.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-white/90">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <Icon size={16} />
                </span>
                <span className="text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 w-full max-w-xs animate-slide-up-in rounded-2xl bg-card/95 p-5 shadow-2xl shadow-black/30 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
              <TrendingUp size={16} />
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              +18.4%
            </span>
          </div>
          <p className="mt-3 text-xs text-muted">Stock accuracy this month</p>
          <div className="mt-4 flex h-20 items-end gap-1.5">
            {stockBars.map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t-md ${
                  i === stockBars.length - 1 ? "bg-amber-500" : "bg-amber-500/25"
                }`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
