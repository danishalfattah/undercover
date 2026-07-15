import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent text-[#2a1c08] border-accent shadow-[0_2px_0_0_var(--color-accent-2)] active:shadow-none active:translate-y-[2px]",
  secondary:
    "bg-transparent text-foreground border-card-border active:bg-black/5",
  danger:
    "bg-danger text-[#f7efdc] border-danger shadow-[0_2px_0_0_#6b271b] active:shadow-none active:translate-y-[2px]",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({ variant = "primary", className = "", disabled, ...props }: ButtonProps) {
  return (
    <button
      className={`min-h-12 w-full rounded-sm border-2 px-5 py-3 text-sm font-bold tracking-[0.14em] uppercase transition-all disabled:opacity-30 disabled:pointer-events-none disabled:shadow-none ${variantClasses[variant]} ${className}`}
      disabled={disabled}
      {...props}
    />
  );
}
