import { cn } from "@/lib/utils.js";

const variants = {
  default:   "bg-accent text-white hover:bg-accent-dark",
  outline:   "border border-portal-border bg-white text-[#1A1A1A] hover:bg-accent-light hover:border-accent",
  ghost:     "bg-transparent hover:bg-accent-light text-[#1A1A1A]",
  danger:    "bg-red-500 text-white hover:bg-red-600",
  secondary: "bg-portal-border text-[#1A1A1A] hover:bg-[#DDD6CE]",
};

const sizes = {
  sm:  "px-3 py-1.5 text-xs",
  md:  "px-4 py-2 text-sm",
  lg:  "px-5 py-2.5 text-sm",
  icon:"p-2",
};

export function Button({ variant = "default", size = "md", className, children, ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
