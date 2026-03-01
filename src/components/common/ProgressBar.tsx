type Props = {
  value: number;
  max: number;
  color?: string;
  gradient?: string;
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  striped?: boolean;
  className?: string;
};

export default function ProgressBar({
  value,
  max,
  color,
  gradient = "from-coral to-pastel-pink",
  size = "sm",
  showLabel = false,
  label,
  animated = true,
  striped = false,
  className = "",
}: Props) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  const heightClass = {
    xs: "h-1",
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  }[size];

  return (
    <div className={className}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between text-[10px] text-warm-gray/50 mb-0.5">
          <span>{label || ""}</span>
          <span>
            {value}/{max}
          </span>
        </div>
      )}
      <div
        className={`w-full ${heightClass} bg-gray-200/60 rounded-full overflow-hidden`}
      >
        <div
          className={`h-full rounded-full ${animated ? "transition-all duration-500" : ""} ${striped ? "progress-stripe" : ""} ${color ? "" : `bg-gradient-to-r ${gradient}`}`}
          style={{
            width: `${percent}%`,
            ...(color ? { backgroundColor: color } : {}),
          }}
        />
      </div>
    </div>
  );
}
