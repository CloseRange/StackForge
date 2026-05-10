import { Link } from "react-router-dom";

import { Logo } from "./Logo";

export const PublicHeader = () => {
  const isDarkMode = !document.documentElement.hasAttribute("data-theme") || 
                     document.documentElement.getAttribute("data-theme") === "dark";

  return (
    <header className={`sticky top-0 z-40 border-b backdrop-blur-md ${
      isDarkMode
        ? "border-white/[0.06] bg-slate-950/80"
        : "border-slate-200 bg-white"
    }`}>
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-6">
        {/* Left — logo */}
        <Logo href="/" />

        {/* Center — nav links */}
        <nav className="hidden items-center gap-1 md:flex"></nav>

        {/* Right — auth buttons */}
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              isDarkMode
                ? "text-slate-300 hover:bg-white/5 hover:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              isDarkMode
                ? "bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-950 shadow-md shadow-sky-500/20 hover:from-sky-300 hover:to-cyan-200"
                : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/20 hover:from-blue-600 hover:to-indigo-600"
            }`}
          >
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
};
