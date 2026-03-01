import { useMemo } from "react";

type ParticleType = "sparkle" | "confetti" | "hearts" | "stars";

type Props = {
  type?: ParticleType;
  count?: number;
  active?: boolean;
  duration?: number;
  className?: string;
};

const particleEmojis: Record<ParticleType, string[]> = {
  sparkle: ["✨", "💫", "⭐", "🌟"],
  confetti: ["🎉", "🎊", "🎈", "✨", "💫"],
  hearts: ["💖", "💗", "💕", "💝", "💓"],
  stars: ["⭐", "🌟", "✨", "💫", "🌠"],
};

type Particle = {
  id: number;
  emoji: string;
  x: number;
  y: number;
  delay: number;
  duration: number;
  size: number;
};

export default function ParticleEffect({
  type = "sparkle",
  count = 12,
  active = true,
  duration = 2000,
  className = "",
}: Props) {
  const particles = useMemo<Particle[]>(() => {
    if (!active) return [];
    const emojis = particleEmojis[type];
    const baseSeed = type.charCodeAt(0) * 31 + count * 17;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      emoji: emojis[Math.floor(seededRandom(baseSeed + i * 5) * emojis.length)],
      x: seededRandom(baseSeed + i * 11) * 100,
      y: seededRandom(baseSeed + i * 13) * 80 + 10,
      delay: seededRandom(baseSeed + i * 17),
      duration: 1.5 + seededRandom(baseSeed + i * 19),
      size: 0.8 + seededRandom(baseSeed + i * 23) * 0.6,
    }));
  }, [active, type, count]);

  if (!active || particles.length === 0) return null;

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden z-10 ${className}`}
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute animate-float"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${Math.max(
              0.6,
              (duration / 1000) * p.duration
            )}s`,
            fontSize: `${p.size}rem`,
            opacity: 0.8,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
