import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { Header } from "../components/header/Header";
import { AuthLayout } from "../layouts/AuthLayout";
import { useAuth } from "../hooks/useAuth";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await login({ email, password });
      navigate("/");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to sign in");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header variant="public" />
      <AuthLayout>
        <form onSubmit={handleSubmit} className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-800/60 p-5 shadow-glow sm:p-8">
          <p className="text-xs uppercase tracking-[0.34em] text-sky-300 sm:text-sm sm:tracking-[0.38em]">Access</p>
          <h2 className="mt-3 font-display text-2xl font-semibold text-white sm:text-3xl">Sign in to your forge</h2>
          <p className="mt-2 text-sm text-slate-400">Pick up where your active campaigns left off.</p>
          <div className="mt-6 space-y-4 sm:mt-8">
            <label className="block text-sm text-slate-300">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
              />
            </label>
            <label className="block text-sm text-slate-300">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
              />
            </label>
          </div>
          {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
          <Button type="submit" className="mt-6 w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
          <p className="mt-4 text-sm text-slate-400">
            Need an account? <Link to="/register" className="text-sky-300">Register</Link>
          </p>
        </form>
      </AuthLayout>
    </>
  );
};
