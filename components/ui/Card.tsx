import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-sm border border-card-border bg-card p-5 shadow-[0_6px_16px_-10px_rgba(42,33,24,0.4)] ${className}`}
      {...props}
    />
  );
}
