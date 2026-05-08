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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 px-4 py-4 backdrop-blur-sm">
      <div className="flex min-h-full items-start justify-center md:items-center">
        <div className="flex w-full max-w-2xl max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-3xl border border-white/25 bg-slate-800/95 p-6 shadow-glow">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-white">{title}</h2>
              {description ? <p className="mt-2 text-sm text-slate-300">{description}</p> : null}
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
