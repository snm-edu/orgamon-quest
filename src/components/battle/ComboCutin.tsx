import { useEffect, useState } from "react";
import "./ComboCutin.css";
import type { TeamCombo } from "../../types";

type Props = {
    combo: TeamCombo;
    heroImages: { id: string, name: string, url?: string, color: string }[];
    onComplete: () => void;
};

export default function ComboCutin({
    combo,
    heroImages,
    onComplete,
}: Props) {
    const [stage, setStage] = useState<"enter" | "hold" | "exit">("enter");

    useEffect(() => {
        // give it slightly more time to appreciate the combo full cast
        const t1 = setTimeout(() => setStage("hold"), 150);
        const t2 = setTimeout(() => setStage("exit"), 2000);
        const t3 = setTimeout(() => onComplete(), 2300);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, []);

    const themeColor = heroImages[0]?.color || "#f08080";

    return (
        <div className={`combo-cutin-container ${stage}`}>
            <div className="combo-cutin-backdrop" />

            {/* Speed Lines */}
            <div className="combo-cutin-speedlines" style={{ borderColor: themeColor }} />

            {/* Colored Band overlay */}
            <div
                className="combo-cutin-band"
                style={{
                    background: `linear-gradient(90deg, transparent, ${themeColor}80, transparent)`,
                }}
            />

            <div className="combo-characters-wrapper">
                {heroImages.map((h, i) => (
                    h.url && (
                        <div key={h.id} style={{ animationDelay: `${i * 0.1}s` }} className="combo-character-item">
                            <img
                                src={h.url}
                                alt={h.name}
                                className="combo-img object-contain"
                                style={{ filter: `drop-shadow(0 0 10px ${h.color})` }}
                            />
                        </div>
                    )
                ))}
            </div>

            {/* Skill Name Text */}
            <div className="combo-cutin-text-container">
                <p className="text-xl text-yellow-300 font-bold mb-1 shadow-black drop-shadow-md italic">TEAM COMBO!</p>
                <h2
                    className="combo-cutin-skillname"
                    style={{ textShadow: `0 0 10px ${themeColor}, 0 0 20px ${themeColor}` }}
                >
                    {combo.name}
                </h2>
            </div>
        </div>
    );
}
