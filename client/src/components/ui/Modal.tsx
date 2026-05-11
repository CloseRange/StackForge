import type { ReactNode } from "react";

import { Button } from "./Button";

type ModalProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
};

export const Modal = ({ isOpen, title, description, onClose, children }: ModalProps) => {
  if (!isOpen) {
    return null;
  }

  const isDarkMode =
    !document.documentElement.hasAttribute("data-theme") ||
    document.documentElement.getAttribute("data-theme") === "dark";

  return (
    <div
      className={`fixed inset-0 z-[140] overflow-y-auto px-4 py-4 backdrop-blur-xl ${
        isDarkMode ? "bg-slate-950/70" : "bg-slate-900/35"
      }`}
    >
      <div className="flex min-h-full items-start justify-center md:items-center">
        <div
          className={`flex w-full max-w-2xl max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-[2rem] border p-6 shadow-[0_30px_90px_rgba(15,23,42,0.45)] ${
            isDarkMode
              ? "border-white/12 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(15,23,42,0.92))]"
              : "border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))]"
          }`}
        >
          <div className={`mb-6 flex items-start justify-between gap-4 border-b pb-5 ${isDarkMode ? "border-white/10" : "border-slate-200"}`}>
            <div>
              <h2 className={`font-display text-2xl font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                {title}
              </h2>
              {description ? (
                <p className={`mt-2 text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                  {description}
                </p>
              ) : null}
            </div>
            <Button variant="ghost" onClick={onClose} className="rounded-full px-4 py-2 text-xs uppercase tracking-[0.16em]">
              Close
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pr-4 [scrollbar-gutter:stable] md:pr-5">{children}</div>
        </div>
      </div>
    </div>
  );
};
