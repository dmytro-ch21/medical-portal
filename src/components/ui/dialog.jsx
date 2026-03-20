import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils.js";
import { X } from "lucide-react";

export function Dialog({ open, onClose, title, children, className }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className={cn("bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col", className)}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-portal-border flex-shrink-0">
          <h2 className="text-base font-semibold text-[#1A1A1A]">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent-light text-muted hover:text-accent transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}
