interface ToastProps {
  message: string;
  type: 'success' | 'warning';
}

export function Toast({ message, type }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-in fade-in ${
        type === 'success'
          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
      }`}
    >
      {message}
    </div>
  );
}
