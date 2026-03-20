import { cn } from "@/lib/utils.js";

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "w-full px-3 py-2 rounded-lg border border-portal-border bg-portal-bg text-sm text-[#1A1A1A] outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors placeholder:text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "w-full px-3 py-2 rounded-lg border border-portal-border bg-portal-bg text-sm text-[#1A1A1A] outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors placeholder:text-muted resize-y",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        "w-full px-3 py-2 rounded-lg border border-portal-border bg-portal-bg text-sm text-[#1A1A1A] outline-none focus:border-accent cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ className, children, ...props }) {
  return (
    <label className={cn("block text-xs font-semibold text-muted mb-1", className)} {...props}>
      {children}
    </label>
  );
}
