import type { ReactNode } from "react";

export const AuthLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <div className="hidden border-r border-white/5 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.15),_transparent_30%)] p-12 lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.45em] text-sky-300">StackForge</p>
          <h1 className="mt-6 max-w-xl font-display text-5xl font-semibold leading-tight text-white">
            Campaign-driven project boards where every task feels like a playable card.
          </h1>
        </div>
        <div className="max-w-lg rounded-[2rem] border border-white/10 bg-white/5 p-6 text-slate-300 backdrop-blur">
          Track campaigns, move cards from deck to victory, and make progress visible through rarity and XP instead of flat lists.
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-12">{children}</div>
    </div>
  );
};
