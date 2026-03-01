import type { ReactNode, CSSProperties } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  variant?: "default" | "strong" | "subtle" | "accent";
  accentColor?: string;
  onClick?: () => void;
  animate?: boolean;
};

export default function GlassCard({
  children,
  className = "",
  style,
  variant = "default",
  accentColor,
  onClick,
  animate = false,
}: Props) {
  const baseClass =
    "rounded-[var(--radius-card)] border transition-all duration-300 [transition-timing-function:var(--transition-soft)]";
  const variantClass = {
    default: "glass edge-highlight border-white/60",
    strong: "glass-strong edge-highlight border-white/70",
    subtle: "bg-white/58 border-white/45 shadow-[var(--shadow-soft)] backdrop-blur-md",
    accent: "glass-panel edge-highlight border-white/75",
  }[variant];

  const interactiveClass = onClick
    ? "cursor-pointer hover:-translate-y-[1px] hover:shadow-[var(--shadow-elevated)] active:translate-y-[1px] active:scale-[0.99] btn-press"
    : "";

  const animateClass = animate ? "animate-slide-up" : "";

  const accentStyle: CSSProperties = accentColor
    ? {
        borderLeft: `3px solid ${accentColor}`,
        boxShadow: `0 10px 24px color-mix(in srgb, ${accentColor} 24%, transparent)`,
        ...style,
      }
    : { ...style };

  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`${baseClass} ${variantClass} ${interactiveClass} ${animateClass} ${className}`}
      style={accentStyle}
    >
      {children}
    </Component>
  );
}
