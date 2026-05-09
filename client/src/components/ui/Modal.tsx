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

  const isDarkMode = !document.documentElement.hasAttribute("data-theme") || 
                     document.documentElement.getAttribute("data-theme") === "dark";

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto px-4 py-4 backdrop-blur-sm ${
      isDarkMode
        ? "bg-slate-900/50"
        : "bg-slate-900/30"
    }`}>
      <div className="flex min-h-full items-start justify-center md:items-center">
        <div className={`flex w-full max-w-2xl max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-3xl border p-6 shadow-glow ${
          isDarkMode
            ? "border-white/25 bg-slate-800/95"
            : "border-slate-200 bg-white"
        }`}>
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className={`font-display text-2xl font-semibold ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}>{title}</h2>
              {description ? (
                <p className={`mt-2 text-sm ${
                  isDarkMode ? "text-slate-300" : "text-slate-600"
                }`}>{description}</p>
              ) : null}
            </div>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pr-4 [scrollbar-gutter:stable] md:pr-5">{children}</div>
        </div>
      </div>
    </div>
  );
};
