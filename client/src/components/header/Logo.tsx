import { Link } from "react-router-dom";

type LogoProps = {
  href?: string;
};

export const Logo = ({ href = "/" }: LogoProps) => {
  const isDarkMode = !document.documentElement.hasAttribute("data-theme") || 
                     document.documentElement.getAttribute("data-theme") === "dark";

  return (
    <Link to={href} className="group flex items-center gap-2.5">
      <img
        src="/StackForge.png"
        alt="StackForge logo"
        className={`h-8 w-8 rounded-[22%] object-cover shadow-lg ${
          isDarkMode ? "ring-1 ring-white/15" : "ring-1 ring-slate-900/10"
        }`}
      />
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
