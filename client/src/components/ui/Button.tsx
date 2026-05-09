import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
  children: ReactNode;
};

const darkModeClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "border border-sky-200/40 bg-gradient-to-r from-sky-300 via-cyan-300 to-indigo-300 text-slate-950 shadow-[0_10px_26px_rgba(56,189,248,0.22)] hover:from-sky-200 hover:via-cyan-200 hover:to-indigo-200",
  ghost: "border border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]",
  outline: "border border-white/18 bg-transparent text-slate-100 hover:bg-white/[0.06]"
};

const lightModeClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "border border-blue-200 bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:from-blue-600 hover:to-indigo-600 active:from-blue-700 active:to-indigo-700",
  ghost: "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 active:bg-slate-200",
  outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100"
};

export const Button = ({ variant = "primary", className = "", children, ...props }: ButtonProps) => {
  const isDarkMode = !document.documentElement.hasAttribute("data-theme") || 
                     document.documentElement.getAttribute("data-theme") === "dark";
  const variantClasses = isDarkMode ? darkModeClasses : lightModeClasses;

  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
