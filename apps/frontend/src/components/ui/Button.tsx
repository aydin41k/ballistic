"use client";

import { cn } from "./cn";
import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "danger" | "amber";
type Size = "sm" | "md";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const base =
  "tap-target inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0";

const variants: Record<Variant, string> = {
  primary: "bg-[var(--blue)] text-white hover:bg-[var(--blue-600)] focus:ring-[var(--blue)]/30",
  ghost:
    "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 focus:ring-slate-300/40",
  danger:
    "bg-white text-red-600 border border-red-200 hover:bg-red-50 focus:ring-red-300/40",
  amber:
    "bg-white text-amber-700 border border-amber-200 hover:bg-amber-50 focus:ring-amber-300/40",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-3 text-sm",
};

export function Button({ variant = "ghost", size = "md", className, ...props }: Props) {
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}


