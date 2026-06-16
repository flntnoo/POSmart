"use client";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/30" onClick={onCancel} aria-label="Tutup dialog" />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {description && <p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className="rounded-xl bg-[#FF6B00] px-4 py-2 text-sm font-bold text-white hover:bg-[#E05E00]">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
