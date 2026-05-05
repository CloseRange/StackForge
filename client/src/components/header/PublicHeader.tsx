import { Link } from "react-router-dom";

import { Logo } from "./Logo";

export const PublicHeader = () => (
  <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-slate-950/80 backdrop-blur-md">
    <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-6">
      {/* Left — logo */}
      <Logo href="/" />

      {/* Center — nav links */}
      <nav className="hidden items-center gap-1 md:flex">
        <Link
          to="#features"
          className="rounded-lg px-3 py-1.5 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
        >
          Features
        </Link>
        <Link
          to="#demo"
          className="rounded-lg px-3 py-1.5 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
        >
          Demo
        </Link>
      </nav>

      {/* Right — auth buttons */}
      <div className="flex items-center gap-2">
        <Link
          to="/login"
          className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          Sign In
        </Link>
        <Link
          to="/register"
          className="rounded-xl bg-gradient-to-r from-sky-400 to-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 shadow-md shadow-sky-500/20 transition hover:from-sky-300 hover:to-cyan-200"
        >
          Sign Up
        </Link>
      </div>
    </div>
  </header>
);
