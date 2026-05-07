import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
  children: ReactNode;
};

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "border border-sky-200/40 bg-gradient-to-r from-sky-300 via-cyan-300 to-indigo-300 text-slate-950 shadow-[0_10px_26px_rgba(56,189,248,0.22)] hover:from-sky-200 hover:via-cyan-200 hover:to-indigo-200",
  ghost: "border border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]",
  outline: "border border-white/18 bg-transparent text-slate-100 hover:bg-white/[0.06]"
};

export const Button = ({ variant = "primary", className = "", children, ...props }: ButtonProps) => {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
