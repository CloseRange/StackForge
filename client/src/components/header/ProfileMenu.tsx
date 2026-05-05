import { useEffect, useRef, useState } from "react";
import { LogOut, Settings, User } from "lucide-react";

import { useAuth } from "../../hooks/useAuth";

export const ProfileMenu = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const initials = user?.displayName
    ? user.displayName.slice(0, 2).toUpperCase()
    : (user?.email?.slice(0, 2).toUpperCase() ?? "??");

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 text-xs font-black text-slate-950 shadow-md shadow-sky-500/20 transition hover:opacity-90"
        aria-label="Open profile menu"
      >
        {initials}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/40">
          <div className="border-b border-white/8 px-4 py-3">
            <div className="truncate text-sm font-semibold text-white">
              {user?.displayName ?? "Operator"}
            </div>
            <div className="truncate text-xs text-slate-400">{user?.email}</div>
          </div>

          <div className="py-1.5">
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <User className="h-4 w-4" />
              Profile
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <div className="mx-4 my-1 border-t border-white/8" />
            <button
              type="button"
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-rose-400 transition hover:bg-white/5 hover:text-rose-300"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
