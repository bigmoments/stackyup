"use client";

import React, { useSyncExternalStore, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  HelpCircle,
  X,
  Loader2,
} from "lucide-react";

export type DialogType = "confirm" | "alert" | "danger" | "success" | "info";

export interface DialogOptions {
  title?: string;
  message: string | React.ReactNode;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => Promise<void> | void;
  onCancel?: () => void;
}

interface ActiveDialog {
  id: string;
  options: DialogOptions;
  resolve: (value: boolean) => void;
}

// -------------------------------------------------------------
// Global Event / Store Pattern (Guaranteed Singleton)
// -------------------------------------------------------------
let activeDialog: ActiveDialog | null = null;
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export const dialogStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot() {
    return activeDialog;
  },
  open(options: DialogOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      activeDialog = {
        id: Math.random().toString(36).slice(2),
        options,
        resolve,
      };
      emitChange();
    });
  },
  close(confirmed: boolean) {
    if (!activeDialog) return;
    const current = activeDialog;
    activeDialog = null;
    emitChange();
    current.resolve(confirmed);
  },
};

// -------------------------------------------------------------
// Imperative API (can be imported or used via useDialog())
// -------------------------------------------------------------
export const dialog = {
  showDialog(options: DialogOptions): Promise<boolean> {
    return dialogStore.open(options);
  },
  confirm(
    titleOrMessage: string,
    messageOrTitle?: string,
    confirmText: string = "Ya, Lanjutkan"
  ): Promise<boolean> {
    const title = messageOrTitle ? titleOrMessage : "Konfirmasi Tindakan";
    const message = messageOrTitle ? messageOrTitle : titleOrMessage;
    return dialogStore.open({
      title,
      message,
      type: "confirm",
      confirmText,
      cancelText: "Batal",
    });
  },
  dangerConfirm(
    titleOrMessage: string,
    messageOrTitle?: string,
    confirmText: string = "Hapus Permanen"
  ): Promise<boolean> {
    const title = messageOrTitle ? titleOrMessage : "Hapus Data?";
    const message = messageOrTitle ? messageOrTitle : titleOrMessage;
    return dialogStore.open({
      title,
      message,
      type: "danger",
      confirmText,
      cancelText: "Batal",
    });
  },
  async alert(
    titleOrMessage: string,
    messageOrTitle?: string,
    type: DialogType = "info"
  ): Promise<void> {
    const title = messageOrTitle ? titleOrMessage : "Pemberitahuan";
    const message = messageOrTitle ? messageOrTitle : titleOrMessage;
    await dialogStore.open({
      title,
      message,
      type,
      confirmText: "Mengerti",
    });
  },
  async success(titleOrMessage: string, messageOrTitle?: string): Promise<void> {
    const title = messageOrTitle ? titleOrMessage : "Berhasil";
    const message = messageOrTitle ? messageOrTitle : titleOrMessage;
    await dialogStore.open({
      title,
      message,
      type: "success",
      confirmText: "OK",
    });
  },
  async error(titleOrMessage: string, messageOrTitle?: string): Promise<void> {
    const title = messageOrTitle ? titleOrMessage : "Terjadi Kesalahan";
    const message = messageOrTitle ? messageOrTitle : titleOrMessage;
    await dialogStore.open({
      title,
      message,
      type: "alert",
      confirmText: "Tutup",
    });
  },
};

/**
 * React Hook for calling dialog inside client components.
 * Returns the exact same imperative API methods.
 */
export function useDialog() {
  return dialog;
}

// -------------------------------------------------------------
// Visual Helper Functions
// -------------------------------------------------------------
function getIcon(type?: DialogType) {
  switch (type) {
    case "danger":
      return <AlertTriangle className="w-5 h-5 text-rose-600" />;
    case "success":
      return <CheckCircle2 className="w-5 h-5 text-[#079653]" />;
    case "alert":
      return <XCircle className="w-5 h-5 text-amber-600" />;
    case "confirm":
      return <HelpCircle className="w-5 h-5 text-[#079653]" />;
    case "info":
    default:
      return <Info className="w-5 h-5 text-blue-600" />;
  }
}

function getIconWrapperClass(type?: DialogType) {
  switch (type) {
    case "danger":
      return "bg-rose-50 border-rose-100";
    case "success":
      return "bg-[#EAF8F0] border-[#c1e8d0]";
    case "alert":
      return "bg-amber-50 border-amber-100";
    case "confirm":
      return "bg-[#EAF8F0] border-[#c1e8d0]";
    case "info":
    default:
      return "bg-blue-50 border-blue-100";
  }
}

function getConfirmButtonClass(type?: DialogType) {
  switch (type) {
    case "danger":
      return "bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus:ring-rose-500";
    case "success":
    case "confirm":
      return "bg-[#079653] hover:bg-[#068046] text-white shadow-xs focus:ring-[#079653]";
    case "alert":
      return "bg-amber-600 hover:bg-amber-700 text-white shadow-xs focus:ring-amber-500";
    case "info":
    default:
      return "bg-[#101313] hover:bg-black text-white shadow-xs focus:ring-black";
  }
}

// -------------------------------------------------------------
// Global Dialog Modal Renderer Component
// -------------------------------------------------------------
export function CustomDialogContainer() {
  const current = useSyncExternalStore(
    dialogStore.subscribe,
    dialogStore.getSnapshot,
    () => null // Server snapshot is always null
  );

  const [loading, setLoading] = useState(false);

  if (!current) return null;

  const handleAction = async (confirmed: boolean) => {
    if (confirmed && current.options.onConfirm) {
      try {
        setLoading(true);
        await current.options.onConfirm();
      } catch (err) {
        console.error("Custom dialog onConfirm error:", err);
      } finally {
        setLoading(false);
      }
    } else if (!confirmed && current.options.onCancel) {
      try {
        current.options.onCancel();
      } catch (err) {
        console.error("Custom dialog onCancel error:", err);
      }
    }

    dialogStore.close(confirmed);
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          handleAction(false);
        }
      }}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl border border-[#E6EBE8] shadow-2xl p-6 relative animate-in zoom-in-95 duration-150 font-sans"
        role="dialog"
        aria-modal="true"
      >
        {/* Close 'X' button */}
        <button
          type="button"
          disabled={loading}
          onClick={() => handleAction(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8a9099] hover:text-[#101313] hover:bg-[#F8FAF9] transition cursor-pointer disabled:opacity-40"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content Header */}
        <div className="flex items-start gap-3.5 mb-4">
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${getIconWrapperClass(
              current.options.type
            )}`}
          >
            {getIcon(current.options.type)}
          </div>
          <div className="pt-0.5 pr-6">
            <h3 className="font-bold text-base text-[#101313] tracking-tight">
              {current.options.title || "Pemberitahuan"}
            </h3>
          </div>
        </div>

        {/* Message Body */}
        <div className="text-xs sm:text-[13px] text-[#4b5563] leading-relaxed mb-6 pl-[54px] -mt-2 break-words">
          {current.options.message}
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F0F3F1]">
          {/* Cancel Button (Rendered only for confirm & danger types) */}
          {(current.options.type === "confirm" ||
            current.options.type === "danger") && (
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction(false)}
              className="px-4 py-2 rounded-xl border border-[#E6EBE8] hover:bg-[#F8FAF9] text-xs font-semibold text-[#4b5563] hover:text-[#101313] transition cursor-pointer disabled:opacity-50"
            >
              {current.options.cancelText || "Batal"}
            </button>
          )}

          {/* Confirm / OK Button */}
          <button
            type="button"
            disabled={loading}
            onClick={() => handleAction(true)}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 ${getConfirmButtonClass(
              current.options.type
            )}`}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>
              {current.options.confirmText ||
                (current.options.type === "confirm"
                  ? "Ya, Lanjutkan"
                  : "OK")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Provider wrapper for backwards compatibility with any layouts.
 * Automatically mounts the CustomDialogContainer.
 */
export function DialogProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CustomDialogContainer />
    </>
  );
}
