import { useEffect, useState } from "react";
import "./SkillCutin.css";

type Props = {
    heroId: string;
    heroName: string;
    skillName: string;
    themeColor: string;
    imageUrl?: string;
    onComplete: () => void;
};

export default function SkillCutin({
    heroName,
    skillName,
    themeColor,
    imageUrl,
    onComplete,
}: Props) {
    const [stage, setStage] = useState<"enter" | "hold" | "exit">("enter");

    useEffect(() => {
        // 0.3s for entering, 1.2s for holding, 0.3s for exiting
        const t1 = setTimeout(() => setStage("hold"), 300);
        const t2 = setTimeout(() => setStage("exit"), 1400);
        const t3 = setTimeout(() => onComplete(), 1700);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, [onComplete]);

    return (
        <div className={`skill-cutin-container ${stage}`}>
            {/* Background Dim */}
            <div className="skill-cutin-backdrop" />

            {/* Speed Lines */}
            <div className="skill-cutin-speedlines" style={{ borderColor: themeColor }} />

            {/* Colored Band overlay */}
            <div
                className="skill-cutin-band"
                style={{
                    background: `linear-gradient(90deg, transparent, ${themeColor}80, transparent)`,
                }}
            />

            {/* Character Image */}
            {imageUrl && (
                <img
                    src={imageUrl}
                    alt={heroName}
                    className="skill-cutin-character"
                    style={{ filter: `drop-shadow(0 0 15px ${themeColor})` }}
                />
            )}

            {/* Skill Name Text */}
            <div className="skill-cutin-text-container">
                <h2
                    className="skill-cutin-skillname"
                    style={{ textShadow: `0 0 10px ${themeColor}, 0 0 20px ${themeColor}` }}
                >
                    {skillName}
                </h2>
            </div>
        </div>
    );
}
