import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Show back button */
  onBack?: () => void;
  backLabel?: string;
  /** Title displayed in header */
  title?: string;
  titleEmoji?: string;
  /** Hero theme color for accent */
  accentColor?: string;
  /** Extra className for the container */
  className?: string;
  /** Show decorative background blobs */
  decorative?: boolean;
  /** Padding variant */
  padding?: "normal" | "compact" | "none";
  /** Background mood */
  theme?: "sunrise" | "ocean" | "forest" | "sunset";
  /** Optional background image to put under everything */
  bgImage?: string;
};

export default function ScreenLayout({
  children,
  onBack,
  backLabel = "もどる",
  title,
  titleEmoji,
  accentColor,
  className = "",
  decorative = true,
  padding = "normal",
  theme = "sunrise",
  bgImage,
}: Props) {
  const padClass =
    padding === "normal"
      ? "px-4 py-5"
      : padding === "compact"
        ? "px-3 py-3"
        : "";

  const backdropClass = {
    sunrise: "screen-backdrop-sunrise",
    ocean: "screen-backdrop-ocean",
    forest: "screen-backdrop-forest",
    sunset: "screen-backdrop-sunset",
  }[theme];

  const haloClass = {
    sunrise: "from-rose-100/70 via-orange-100/35 to-transparent",
    ocean: "from-sky-100/70 via-cyan-100/35 to-transparent",
    forest: "from-green-100/70 via-emerald-100/35 to-transparent",
    sunset: "from-orange-100/70 via-pink-100/35 to-transparent",
  }[theme];

  return (
    <div
      className={`h-[100dvh] relative overflow-x-hidden overflow-y-auto screen-enter ${padClass} ${className}`}
    >
      {bgImage && (
        <div
          className="absolute inset-0 pointer-events-none -z-20 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgImage})`, opacity: 0.15, mixBlendMode: 'multiply' }}
        />
      )}
      {/* Decorative background blobs (fixed position so they don't scroll away) */}
      {decorative && (
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden" style={{ position: 'fixed' }}>
          <div className={`screen-backdrop ${backdropClass}`} />
          <div className="absolute inset-0 bg-noise-soft" />
          <div className={`absolute inset-x-0 -top-16 h-52 bg-gradient-to-b ${haloClass}`} />
          <div
            className="absolute -top-16 -left-16 w-56 h-56 rounded-full blur-3xl opacity-40 float-drift"
            style={{ backgroundColor: accentColor || "#ffb6c1" }}
          />
          <div className="absolute -bottom-20 -right-10 w-64 h-64 bg-pastel-blue/30 rounded-full blur-3xl float-drift-delayed" />
          <div className="absolute top-1/3 right-3 w-32 h-32 bg-pastel-green/25 rounded-full blur-2xl float-drift" />
          <div className="absolute left-1/2 top-2/3 -translate-x-1/2 w-28 h-28 bg-pastel-yellow/20 rounded-full blur-2xl float-drift-delayed" />
        </div>
      )}

      {/* Header with back button and title */}
      {(onBack || title) && (
        <div className="flex items-center gap-3 mb-5">
          {onBack && (
            <button
              onClick={onBack}
              className="w-9 h-9 glass edge-highlight rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all btn-press text-warm-gray/70 text-sm shrink-0"
              aria-label={backLabel}
            >
              ←
            </button>
          )}
          {title && (
            <h1 className="text-lg font-bold text-warm-gray flex items-center gap-2 truncate">
              {titleEmoji && <span>{titleEmoji}</span>}
              {title}
            </h1>
          )}
        </div>
      )}

      {children}
    </div>
  );
}
