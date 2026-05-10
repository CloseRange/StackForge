import { Link } from "react-router-dom";
import { Bug, ExternalLink, FileText, Github, Shield, Sparkles } from "lucide-react";

const portfolioUrl = import.meta.env.VITE_PORTFOLIO_URL?.trim();

const footerGroups = [
  {
    title: "Product",
    links: [
      { to: "/features", label: "Features", icon: Sparkles },
      { to: "/demo", label: "Demo Board", icon: FileText },
      { to: "/documentation", label: "Documentation", icon: FileText }
    ]
  },
  {
    title: "Company",
    links: [
      { href: "https://github.com/CloseRange/StackForge", label: "GitHub", icon: Github },
      ...(portfolioUrl
        ? [{ href: portfolioUrl, label: "Portfolio", icon: ExternalLink }]
        : [])
    ]
  },
  {
    title: "Support",
    links: [
      { to: "/report-a-bug", label: "Report a Bug", icon: Bug },
      { to: "/terms", label: "Terms and Conditions", icon: Shield },
      { to: "/privacy", label: "Privacy", icon: Shield }
    ]
  }
] as const;

export const SiteFooter = () => {
  return (
    <footer className="border-t border-white/10 bg-slate-950/80 px-6 py-10 backdrop-blur-md">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_60px_rgba(8,15,32,0.28)] sm:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-md">
            <p className="text-xs uppercase tracking-[0.38em] text-sky-300">StackForge</p>
            <h2 className="mt-3 font-display text-2xl font-semibold text-white">Campaign-driven project management.</h2>
            <p className="mt-3 text-sm text-slate-400">
              Ship campaigns, inspect the demo board, read the docs, or send a message directly to the site admin.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{group.title}</p>
                <div className="mt-4 space-y-3">
                  {group.links.map((link) => {
                    const Icon = link.icon;

                    if ("to" in link) {
                      return (
                        <Link
                          key={link.label}
                          to={link.to}
                          className="flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
                        >
                          <Icon className="h-4 w-4 text-sky-300" />
                          <span>{link.label}</span>
                        </Link>
                      );
                    }

                    return (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
                      >
                        <Icon className="h-4 w-4 text-sky-300" />
                        <span>{link.label}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-4 text-xs text-slate-500">
          © 2026 StackForge. Built for campaigns, cards, and clear progress.
        </div>
      </div>
    </footer>
  );
};