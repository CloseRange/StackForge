import { Link } from "react-router-dom";

type LogoProps = {
  href?: string;
};

export const Logo = ({ href = "/" }: LogoProps) => {
  const isDarkMode = !document.documentElement.hasAttribute("data-theme") || 
                     document.documentElement.getAttribute("data-theme") === "dark";

  return (
    <Link to={href} className="group flex items-center gap-2.5">
      <div className={`flex h-8 w-8 items-center justify-center rounded-xl shadow-lg ${
        isDarkMode
          ? "bg-gradient-to-br from-sky-400 to-cyan-300 shadow-sky-500/20"
          : "bg-gradient-to-br from-blue-500 to-indigo-500 shadow-blue-500/20"
      }`}>
        <span className={`text-xs font-black tracking-tight ${
          isDarkMode ? "text-slate-950" : "text-white"
        }`}>SF</span>
      </div>
      <span className={`hidden font-display text-base font-semibold transition-colors sm:inline ${
        isDarkMode
          ? "text-white group-hover:text-sky-300"
          : "text-slate-900 group-hover:text-blue-600"
      }`}>
        StackForge
      </span>
    </Link>
  );
};
