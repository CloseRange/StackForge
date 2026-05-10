import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "./Button";
import { Modal } from "./Modal";

type ConfirmationModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  children?: ReactNode;
  isConfirming?: boolean;
  confirmDisabled?: boolean;
  cancelLabel?: string;
};

export const ConfirmationModal = ({
  isOpen,
  title,
  description,
  confirmLabel,
  onClose,
  onConfirm,
  children,
  isConfirming = false,
  confirmDisabled = false,
  cancelLabel = "Cancel"
}: ConfirmationModalProps) => {
  return (
    <Modal isOpen={isOpen} title={title} description={description} onClose={onClose}>
      <div className="space-y-5">
        <div className="flex items-start gap-4 rounded-2xl border border-rose-400/15 bg-gradient-to-br from-rose-500/15 via-rose-500/10 to-orange-500/10 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-300/20 bg-rose-500/15 text-rose-100 shadow-[0_10px_30px_rgba(244,63,94,0.12)]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-200/90">Confirmation required</p>
            <p className="mt-2 text-sm leading-6 text-slate-200/90">This action affects the project immediately.</p>
          </div>
        </div>

        {children}

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose} disabled={isConfirming} className="sm:min-w-28">
            {cancelLabel}
          </Button>
          <Button
            variant="outline"
            onClick={() => void onConfirm()}
            disabled={isConfirming || confirmDisabled}
            className="border border-rose-300/40 bg-gradient-to-r from-rose-500 via-red-500 to-rose-600 text-white shadow-[0_12px_28px_rgba(244,63,94,0.28)] hover:from-rose-400 hover:via-red-400 hover:to-rose-500"
          >
            {isConfirming ? `${confirmLabel}...` : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
