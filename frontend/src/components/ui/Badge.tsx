import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "info" | "outline";

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface-secondary text-fg-secondary",
  // primary uses dark: prefix because aeos-* colors are static hex (not CSS vars)
  primary: "bg-aeos-50 text-aeos-700 dark:bg-aeos-500/10 dark:text-aeos-400",
  success: "bg-status-success-light text-status-success-text",
  warning: "bg-status-warning-light text-status-warning-text",
  danger: "bg-status-danger-light text-status-danger-text",
  info: "bg-status-info-light text-status-info-text",
  outline: "border border-border text-fg-secondary bg-surface",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", variantStyles[variant], className)}>
      {children}
    </span>
  );
}
