import type { ReactNode } from "react";

import { Header } from "../components/header/Header";

type PublicPageLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export const PublicPageLayout = ({ eyebrow, title, description, children }: PublicPageLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <Header variant="public" />
      <main className="px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.38em] text-sky-300">{eyebrow}</p>
            <h1 className="mt-4 font-display text-4xl font-semibold text-white sm:text-5xl">{title}</h1>
            <p className="mt-4 text-base text-slate-400 sm:text-lg">{description}</p>
          </div>
          <div className="mt-10 rounded-[2rem] border border-white/10 bg-slate-900/55 p-6 shadow-[0_24px_70px_rgba(4,9,20,0.28)] sm:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};