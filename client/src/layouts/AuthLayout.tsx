import type { ReactNode } from "react";

export const AuthLayout = ({ children }: { children: ReactNode }) => {
  const isDarkMode = !document.documentElement.hasAttribute("data-theme") || 
                     document.documentElement.getAttribute("data-theme") === "dark";

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <div className={`hidden border-r p-12 lg:flex lg:flex-col lg:justify-between ${
        isDarkMode
          ? "border-white/5 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.15),_transparent_30%)]"
          : "border-slate-200 bg-gradient-to-br from-blue-50 via-white to-slate-50"
      }`}>
        <div>
          <p className={`text-sm uppercase tracking-[0.45em] ${
            isDarkMode ? "text-sky-300" : "text-blue-600"
          }`}>StackForge</p>
          <h1 className={`mt-6 max-w-xl font-display text-5xl font-semibold leading-tight ${
            isDarkMode ? "text-white" : "text-slate-900"
          }`}>
            Campaign-driven project boards where every task feels like a playable card.
          </h1>
        </div>
        <div className={`max-w-lg rounded-[2rem] border p-6 backdrop-blur ${
          isDarkMode
            ? "border-white/10 bg-white/5 text-slate-300"
            : "border-slate-200 bg-white/60 text-slate-700"
        }`}>
          Track campaigns, move cards from deck to victory, and make progress visible through rarity and XP instead of flat lists.
        </div>
      </div>
      <div className={`flex items-center justify-center px-4 py-8 sm:px-6 sm:py-12 ${
        isDarkMode ? "" : "bg-slate-50"
      }`}>{children}</div>
    </div>
  );
};
