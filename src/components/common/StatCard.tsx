type Props = {
  label: string;
  value: string | number;
  icon?: string;
  subLabel?: string;
  color?: string;
  className?: string;
};

export default function StatCard({
  label,
  value,
  icon,
  subLabel,
  color,
  className = "",
}: Props) {
  return (
    <div
      className={`glass rounded-xl p-3 text-center transition-all hover:shadow-sm ${className}`}
    >
      <p className="text-[10px] text-warm-gray/50 mb-0.5">{label}</p>
      <p className="font-bold text-warm-gray text-lg" style={color ? { color } : {}}>
        {icon && <span className="mr-1">{icon}</span>}
        {value}
      </p>
      {subLabel && (
        <p className="text-[10px] text-warm-gray/40 mt-0.5">{subLabel}</p>
      )}
    </div>
  );
}
