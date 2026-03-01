import { useEffect } from "react";
import type { ReactNode } from "react";

type Props = {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  /** "center" for dialog, "bottom" for bottom sheet */
  position?: "center" | "bottom";
  className?: string;
  showHandle?: boolean;
};

export default function Modal({
  open,
  onClose,
  children,
  position = "center",
  className = "",
  showHandle = false,
}: Props) {
  useEffect(() => {
    if (!open || !onClose) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const positionClass =
    position === "center"
      ? "items-center justify-center"
      : "items-end justify-center";

  const contentClass =
    position === "center"
      ? "rounded-3xl max-w-sm w-full mx-4 max-h-[85dvh] animate-pop border border-white/70"
      : "rounded-t-3xl w-full max-w-md max-h-[88dvh] animate-slide-up border border-white/70 border-b-0";

  const paddingClass =
    position === "bottom"
      ? "px-5 pt-5 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
      : "p-5";

  return (
    <div
      className={`fixed inset-0 bg-[#2d1d3c]/38 backdrop-blur-[3px] z-50 flex ${positionClass} animate-fade-in`}
      onClick={onClose}
    >
      <div
        className={`glass-panel edge-highlight ${paddingClass} shadow-[var(--shadow-elevated)] overflow-hidden ${contentClass} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {showHandle && (
          <div className="w-12 h-1.5 bg-warm-gray/25 rounded-full mx-auto mb-4" />
        )}
        {children}
      </div>
    </div>
  );
}
