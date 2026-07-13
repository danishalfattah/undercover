import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-white active:bg-emerald-700",
  secondary: "bg-white text-foreground border border-slate-300 active:bg-slate-100",
  danger: "bg-danger text-white active:bg-red-700",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({ variant = "primary", className = "", disabled, ...props }: ButtonProps) {
  return (
    <button
      className={`min-h-11 w-full rounded-xl px-5 py-3 text-base font-semibold transition-colors disabled:opacity-40 disabled:pointer-events-none ${variantClasses[variant]} ${className}`}
      disabled={disabled}
      {...props}
    />
  );
}
