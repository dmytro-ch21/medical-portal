import { cn } from "@/lib/utils.js";

export function Card({ className, children, ...props }) {
  return (
    <div className={cn("bg-white rounded-xl border border-portal-border", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return <div className={cn("px-5 py-4 border-b border-portal-border", className)} {...props}>{children}</div>;
}

export function CardBody({ className, children, ...props }) {
  return <div className={cn("px-5 py-4", className)} {...props}>{children}</div>;
}

export function CardTitle({ className, children, ...props }) {
  return <h3 className={cn("text-sm font-semibold text-[#1A1A1A]", className)} {...props}>{children}</h3>;
}
