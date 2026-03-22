import { useState, useEffect, useRef } from "react";
import { useGameStore } from "../stores/gameStore";
import { useMetaStore } from "../stores/metaStore";
import { audio } from "../utils/audio";
import heroesData from "../data/heroes.json";
import type { Hero } from "../types";

const heroes = heroesData as Hero[];

const endingVideos: Record<string, string> = {
  minato: "/orgamon-quest/images/videos/minato_ending.mp4",
  hikari: "/orgamon-quest/images/videos/hikari_ending.mp4",
  kotoha: "/orgamon-quest/images/videos/kotoha_ending.mp4",
  leon: "/orgamon-quest/images/videos/leon_ending.mp4",
};

const heroProfessions: Record<string, string> = {
  minato: "看護師",
  hikari: "視能訓練士",
  kotoha: "歯科衛生士",
  leon: "臨床工学技士",
};

const heroEpilogues: Record<string, string> = {
  minato:
    "患者の命に最も近い存在として\nその戦いは、ここから始まる——",
  hikari:
    "すべての異変を見逃さない瞳で\n未来を見守り続ける——",
  kotoha:
    "口腔から全身の健康を守る盾として\n予防ケアは、終わらない——",
  leon:
    "生命を支える機械の守護者として\nそのシステムは、永遠に稼働し続ける——",
};

type Phase = "video" | "epilogue" | "fin";

export default function EndingScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const currentRun = useGameStore((s) => s.currentRun);
  const totalClears = useMetaStore((s) => s.meta.totalClears);
  const heroId = currentRun?.selectedHeroId || "minato";
  const hero = heroes.find((h) => h.id === heroId);
  const playerName = currentRun?.playerName || hero?.name || "プレイヤー";
  const displayTitle = `${heroProfessions[heroId] || ""}・${playerName}`;

  const [phase, setPhase] = useState<Phase>("video");
  const [fadeIn, setFadeIn] = useState(false);
  const [showFinButtons, setShowFinButtons] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    audio.playBGM("ending");
    setTimeout(() => setFadeIn(true), 300);
  }, []);

  const handleVideoEnd = () => {
    setFadeIn(false);
    setTimeout(() => {
      setPhase("epilogue");
      setFadeIn(true);
    }, 800);
  };

  useEffect(() => {
    if (phase === "epilogue") {
      const timer = setTimeout(() => {
        setFadeIn(false);
        setTimeout(() => {
          setPhase("fin");
          setFadeIn(true);
          setTimeout(() => setShowFinButtons(true), 2000);
        }, 800);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleGoHome = () => {
    audio.playBGM("title");
    setScreen("title");
  };

  const themeColor = hero?.themeColor || "#f08080";

  return (
    <div
      className="h-[100dvh] flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "#000" }}
    >
      {/* === PHASE: VIDEO === */}
      {phase === "video" && (
        <div
          className={`w-full h-full flex flex-col items-center justify-center transition-opacity duration-700 ${fadeIn ? "opacity-100" : "opacity-0"}`}
        >
          {/* Title overlay */}
          <div className="absolute top-6 left-0 right-0 z-20 text-center">
            <p className="text-[11px] tracking-[0.4em] uppercase mb-1 font-semibold text-yellow-300">
              — Ending —
            </p>
            <h2 className="text-lg font-extrabold tracking-wider text-white"
              style={{ textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}>
              {displayTitle}
            </h2>
          </div>

          {/* Video - fullscreen */}
          <div className="w-full h-full absolute inset-0">
            <video
              ref={videoRef}
              src={endingVideos[heroId]}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
              onEnded={handleVideoEnd}
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(0deg, #000 0%, transparent 20%, transparent 80%, #000 100%)",
              }}
            />
          </div>

          {/* Skip */}
          <button
            onClick={handleVideoEnd}
            className="absolute bottom-6 right-4 z-30 px-4 py-2 rounded-xl text-xs text-white font-medium backdrop-blur-sm"
            style={{ background: "rgba(0,0,0,0.6)" }}
          >
            スキップ ▶▶
          </button>
        </div>
      )}

      {/* === PHASE: EPILOGUE === */}
      {phase === "epilogue" && (
        <div
          className={`flex flex-col items-center justify-center px-6 text-center transition-opacity duration-700 ${fadeIn ? "opacity-100" : "opacity-0"}`}
        >
          {/* Hero portrait */}
          <div
            className="w-32 h-32 rounded-full overflow-hidden mb-8 shadow-2xl"
            style={{
              border: `3px solid ${themeColor}`,
              boxShadow: `0 0 40px ${themeColor}40`,
            }}
          >
            {hero?.imageUrl && (
              <img
                src={hero.imageUrl}
                alt={hero.name}
                className="w-full h-full object-cover object-top"
              />
            )}
          </div>

          {/* Epilogue text - pure white on black */}
          <div className="space-y-4 mb-10">
            {(heroEpilogues[heroId] || "").split("\n").map((line, i) => (
              <p
                key={i}
                className="text-white text-lg font-bold tracking-wide leading-relaxed"
                style={{
                  animation: `fadeSlideUp 1s ease-out ${0.5 + i * 0.8}s both`,
                }}
              >
                {line}
              </p>
            ))}
          </div>

          {/* Congrats */}
          <div style={{ animation: "fadeSlideUp 1s ease-out 2.5s both" }}>
            <p className="text-lg font-extrabold tracking-[0.15em] text-yellow-300">
              🏆 CONGRATULATIONS 🏆
            </p>
            <p className="text-white text-base mt-2 font-bold">
              クリア回数: {totalClears}
            </p>
          </div>
        </div>
      )}

      {/* === PHASE: FIN === */}
      {phase === "fin" && (
        <div
          className={`flex flex-col items-center justify-center text-center transition-opacity duration-1000 ${fadeIn ? "opacity-100" : "opacity-0"}`}
        >
          <div
            className="mb-10"
            style={{ animation: "fadeSlideUp 1.5s ease-out both" }}
          >
            <h1
              className="text-7xl font-black tracking-[0.4em] mb-5 text-white"
              style={{
                textShadow: `0 0 40px ${themeColor}, 0 0 80px ${themeColor}80`,
              }}
            >
              FIN
            </h1>
            <p className="text-white text-xl font-extrabold tracking-[0.15em] mb-6">
              オルガモン図鑑クエスト
            </p>
            <p className="text-yellow-200 text-base tracking-[0.2em] font-bold"
              style={{ animation: "fadeSlideUp 1s ease-out 1s both" }}
            >
              Presented by N.Y
            </p>
          </div>

          {/* Buttons */}
          {showFinButtons && (
            <div
              className="space-y-3 w-64"
              style={{ animation: "fadeSlideUp 0.8s ease-out both" }}
            >
              <button
                onClick={handleGoHome}
                className="w-full py-3.5 rounded-xl text-base font-bold text-white tracking-wider transition-all hover:scale-105 active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)`,
                  boxShadow: `0 4px 24px ${themeColor}50`,
                }}
              >
                🏠 タイトルへ戻る
              </button>
              <button
                onClick={() => {
                  audio.playBGM("map");
                  setScreen("chapter_map");
                }}
                className="w-full py-2.5 rounded-xl text-sm text-white font-medium transition-colors"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                🗺️ 冒険を続ける
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
