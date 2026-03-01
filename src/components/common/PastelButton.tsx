import type { ReactNode, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";
type GradientPreset = "coral" | "lavender" | "mint" | "sky" | "gold";

const gradientMap: Record<GradientPreset, string> = {
  coral: "from-coral to-pastel-pink",
  lavender: "from-lavender to-pastel-purple",
  mint: "from-mint to-pastel-green",
  sky: "from-sky to-pastel-blue",
  gold: "from-amber-400 to-yellow-300",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  gradient?: GradientPreset;
  icon?: string;
  fullWidth?: boolean;
  loading?: boolean;
};

export default function PastelButton({
  children,
  variant = "primary",
  size = "md",
  gradient = "coral",
  icon,
  fullWidth = false,
  loading = false,
  className = "",
  disabled,
  ...props
}: Props) {
  const sizeClass = {
    sm: "py-2 px-4 text-sm rounded-xl",
    md: "py-3 px-6 text-base rounded-2xl",
    lg: "py-4 px-8 text-lg rounded-2xl",
  }[size];

  const variantClass = {
    primary: `bg-gradient-to-r ${gradientMap[gradient]} text-white font-bold shadow-[var(--shadow-button)] hover:shadow-[var(--shadow-button-hover)]`,
    secondary: "glass edge-highlight text-warm-gray font-semibold shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)]",
    ghost: "bg-white/25 text-warm-gray/75 border border-white/45 hover:bg-white/45 hover:text-warm-gray",
    danger: "bg-gradient-to-r from-red-400 to-red-300 text-white font-bold shadow-[var(--shadow-button)] hover:shadow-[var(--shadow-button-hover)]",
    success: "bg-gradient-to-r from-mint to-pastel-green text-white font-bold shadow-[var(--shadow-button)] hover:shadow-[var(--shadow-button-hover)]",
  }[variant];

  const widthClass = fullWidth ? "w-full" : "";
  const disabledClass = disabled || loading ? "opacity-50 pointer-events-none" : "";

  return (
    <button
      className={`${sizeClass} ${variantClass} ${widthClass} ${disabledClass} group relative overflow-hidden transition-all duration-300 [transition-timing-function:var(--transition-soft)] btn-press inline-flex items-center justify-center gap-2 ring-1 ring-white/35 ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 bg-gradient-to-b from-white/35 to-transparent group-hover:opacity-100" />
      {loading ? (
        <span className="animate-spin-slow inline-block">⏳</span>
      ) : icon ? (
        <span className="relative z-10">{icon}</span>
      ) : null}
      <span className="relative z-10">{children}</span>
    </button>
  );
}
