import type { ReactNode } from "react";

type Variant = "default" | "success" | "warning" | "danger" | "info" | "rarity";
type Size = "xs" | "sm" | "md";

type Props = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  icon?: string;
  color?: string;
  className?: string;
};

const variantStyles: Record<Variant, string> = {
  default: "bg-white/62 text-warm-gray border border-white/65 shadow-[var(--shadow-soft)]",
  success: "bg-pastel-green/45 text-green-700 border border-green-200/80 shadow-[var(--shadow-soft)]",
  warning: "bg-pastel-yellow/62 text-amber-700 border border-amber-200/70 shadow-[var(--shadow-soft)]",
  danger: "bg-red-100 text-red-500 border border-red-200/80 shadow-[var(--shadow-soft)]",
  info: "bg-pastel-blue/45 text-blue-700 border border-blue-200/80 shadow-[var(--shadow-soft)]",
  rarity: "text-white border border-white/45 shadow-[var(--shadow-soft)]",
};

export default function Badge({
  children,
  variant = "default",
  size = "sm",
  icon,
  color,
  className = "",
}: Props) {
  const sizeClass = {
    xs: "text-[10px] px-1.5 py-0.5",
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
  }[size];

  const colorStyle = color ? { backgroundColor: color } : {};

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[var(--radius-pill)] font-semibold tracking-wide ${sizeClass} ${variantStyles[variant]} ${className}`}
      style={colorStyle}
    >
      {icon && <span>{icon}</span>}
      {children}
    </span>
  );
}
