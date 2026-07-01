import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Wrench } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Button from "../components/common/Button";
import Spinner from "../components/common/Spinner";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <Spinner label="Checking session..." />
      </div>
    );
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
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="flex h-screen items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: "url(/src/assets/images/login.jpg)",
      }}
    >
      {/* Dark overlay for better readability */}
      <div className="absolute inset-0 bg-black/50" />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-2xl border border-zinc-700/50 bg-zinc-900/95 backdrop-blur-sm p-10 shadow-2xl shadow-black/60"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-400">
            <Wrench size={28} strokeWidth={1.5} />
          </span>
          <h1 className="text-2xl font-bold text-zinc-50">
            Spare Parts Inventory
          </h1>
          <p className="mt-2 text-sm font-medium text-zinc-400">
            Inventory Management System
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-200">
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full rounded-lg border border-zinc-600 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 transition duration-200 focus:border-amber-500 focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-200">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-lg border border-zinc-600 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 transition duration-200 focus:border-amber-500 focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full bg-gradient-to-r from-amber-500 to-amber-600 py-3 font-semibold hover:from-amber-600 hover:to-amber-700 disabled:from-zinc-600 disabled:to-zinc-700"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} Spare Parts Management. All rights
          reserved.
        </p>
      </form>
    </div>
  );
}
