import { cn } from "@/lib/utils.js";

export function Badge({ style, className, children }) {
  return (
    <span
      className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", className)}
      style={style}
    >
      {children}
    </span>
  );
}
