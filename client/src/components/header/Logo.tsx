import { Link } from "react-router-dom";

type LogoProps = {
  href?: string;
};

export const Logo = ({ href = "/" }: LogoProps) => (
  <Link to={href} className="group flex items-center gap-2.5">
    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-cyan-300 shadow-lg shadow-sky-500/20">
      <span className="text-xs font-black tracking-tight text-slate-950">SF</span>
    </div>
    <span className="font-display text-base font-semibold text-white transition-colors group-hover:text-sky-300">
      StackForge
    </span>
  </Link>
);
