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

const heroTitles: Record<string, string> = {
  minato: "ケアプランナー・ミナト",
  hikari: "精密観察士・ヒカリ",
  kotoha: "予防ガーディアン・コトハ",
  leon: "システムマスター・レオン",
};

const heroEpilogues: Record<string, string> = {
  minato:
    "患者の命に最も近い存在として\nミナトの戦いは、ここから始まる——",
  hikari:
    "すべての異変を見逃さない瞳で\nヒカリは、未来を見守り続ける——",
  kotoha:
    "口腔から全身の健康を守る盾として\nコトハの予防ケアは、終わらない——",
  leon:
    "生命を支える機械の守護者として\nレオンのシステムは、永遠に稼働し続ける——",
};

const staffCredits = [
  { role: "企画・監修", name: "湘南医療大学" },
  { role: "ゲームデザイン", name: "入学前教育プロジェクトチーム" },
  { role: "キャラクターデザイン", name: "AI Art Generation" },
  { role: "音楽", name: "AI Music Generation" },
  { role: "ストーリー", name: "Medical Education Team" },
  { role: "プログラミング", name: "Orgamon Quest Dev Team" },
  { role: "スペシャルサンクス", name: "新入生のみなさん" },
];

type Phase = "video" | "epilogue" | "credits" | "fin";

export default function EndingScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const currentRun = useGameStore((s) => s.currentRun);
  const totalClears = useMetaStore((s) => s.meta.totalClears);
  const heroId = currentRun?.selectedHeroId || "minato";
  const hero = heroes.find((h) => h.id === heroId);
  const playerName = currentRun?.playerName || hero?.name || "プレイヤー";

  const [phase, setPhase] = useState<Phase>("video");
  const [fadeIn, setFadeIn] = useState(false);
  const [creditScroll, setCreditScroll] = useState(false);
  const [showFinButtons, setShowFinButtons] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Ensure ending BGM is playing
  useEffect(() => {
    audio.playBGM("ending");
    setTimeout(() => setFadeIn(true), 300);
  }, []);

  // When video ends, move to epilogue
  const handleVideoEnd = () => {
    setFadeIn(false);
    setTimeout(() => {
      setPhase("epilogue");
      setFadeIn(true);
    }, 800);
  };

  // Epilogue auto-advance
  useEffect(() => {
    if (phase === "epilogue") {
      const timer = setTimeout(() => {
        setFadeIn(false);
        setTimeout(() => {
          setPhase("credits");
          setFadeIn(true);
          setTimeout(() => setCreditScroll(true), 600);
        }, 800);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Credits auto-advance
  useEffect(() => {
    if (phase === "credits") {
      const timer = setTimeout(() => {
        setFadeIn(false);
        setTimeout(() => {
          setPhase("fin");
          setFadeIn(true);
          setTimeout(() => setShowFinButtons(true), 2000);
        }, 800);
      }, 12000);
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
      style={{
        background: `linear-gradient(180deg, #0a0a1a 0%, ${themeColor}15 50%, #0a0a1a 100%)`,
      }}
    >
      {/* Animated particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: `${themeColor}80`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${4 + Math.random() * 6}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: 0.3 + Math.random() * 0.5,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
            }}
          />
        ))}
      </div>

      {/* === PHASE: VIDEO === */}
      {phase === "video" && (
        <div
          className={`w-full h-full flex flex-col items-center justify-center transition-opacity duration-700 ${fadeIn ? "opacity-100" : "opacity-0"}`}
        >
          {/* Title overlay */}
          <div className="absolute top-8 z-20 text-center">
            <p
              className="text-xs tracking-[0.3em] uppercase mb-1"
              style={{ color: `${themeColor}aa` }}
            >
              Ending
            </p>
            <h2
              className="text-lg font-bold tracking-wider"
              style={{ color: themeColor }}
            >
              {heroTitles[heroId] || hero?.name}
            </h2>
          </div>

          {/* Video */}
          <div className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-2xl relative" style={{ border: `2px solid ${themeColor}40` }}>
            <video
              ref={videoRef}
              src={endingVideos[heroId]}
              className="w-full h-auto"
              autoPlay
              playsInline
              muted={false}
              onEnded={handleVideoEnd}
              style={{ maxHeight: "60dvh", objectFit: "cover" }}
            />
            {/* Gradient overlays */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(0deg, #0a0a1a 0%, transparent 20%, transparent 80%, #0a0a1a 100%)`,
              }}
            />
          </div>

          {/* Player name */}
          <div className="absolute bottom-12 z-20 text-center">
            <p className="text-white/30 text-xs tracking-widest">
              {playerName} の物語
            </p>
          </div>

          {/* Skip button */}
          <button
            onClick={handleVideoEnd}
            className="absolute bottom-4 right-4 z-30 px-3 py-1.5 rounded-lg text-[10px] text-white/30 hover:text-white/60 transition-colors"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            スキップ ▶▶
          </button>
        </div>
      )}

      {/* === PHASE: EPILOGUE === */}
      {phase === "epilogue" && (
        <div
          className={`flex flex-col items-center justify-center px-8 text-center transition-opacity duration-700 ${fadeIn ? "opacity-100" : "opacity-0"}`}
        >
          {/* Hero portrait */}
          <div
            className="w-28 h-28 rounded-full overflow-hidden mb-6 shadow-xl"
            style={{
              border: `3px solid ${themeColor}60`,
              boxShadow: `0 0 40px ${themeColor}30`,
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

          {/* Epilogue text */}
          <div className="space-y-2 mb-8">
            {(heroEpilogues[heroId] || "").split("\n").map((line, i) => (
              <p
                key={i}
                className="text-white/80 text-base font-light tracking-wide leading-relaxed"
                style={{
                  animation: `fadeSlideUp 1s ease-out ${0.5 + i * 0.8}s both`,
                }}
              >
                {line}
              </p>
            ))}
          </div>

          {/* Congrats */}
          <div
            className="mt-4"
            style={{ animation: "fadeSlideUp 1s ease-out 2.5s both" }}
          >
            <p className="text-xs text-white/40 tracking-widest">
              🏆 CONGRATULATIONS 🏆
            </p>
            <p className="text-sm text-white/50 mt-2">
              クリア回数: {totalClears}
            </p>
          </div>
        </div>
      )}

      {/* === PHASE: CREDITS === */}
      {phase === "credits" && (
        <div
          className={`w-full h-full flex flex-col items-center justify-center relative transition-opacity duration-700 ${fadeIn ? "opacity-100" : "opacity-0"}`}
        >
          <div className="absolute top-8 text-center z-10">
            <h2
              className="text-xl font-bold tracking-[0.2em]"
              style={{ color: `${themeColor}cc` }}
            >
              STAFF CREDITS
            </h2>
          </div>

          <div
            className={`flex flex-col items-center gap-8 transition-transform duration-[10000ms] ease-linear ${creditScroll ? "-translate-y-[60%]" : "translate-y-[30%]"}`}
          >
            {staffCredits.map((credit, i) => (
              <div key={i} className="text-center">
                <p className="text-white/30 text-xs tracking-[0.15em] uppercase mb-1">
                  {credit.role}
                </p>
                <p className="text-white/70 text-base font-medium">
                  {credit.name}
                </p>
              </div>
            ))}

            <div className="mt-8 text-center">
              <p className="text-white/20 text-xs tracking-widest">
                — Thank You For Playing —
              </p>
            </div>
          </div>
        </div>
      )}

      {/* === PHASE: FIN === */}
      {phase === "fin" && (
        <div
          className={`flex flex-col items-center justify-center text-center transition-opacity duration-1000 ${fadeIn ? "opacity-100" : "opacity-0"}`}
        >
          {/* Logo / Fin text */}
          <div
            className="mb-8"
            style={{ animation: "fadeSlideUp 1.5s ease-out both" }}
          >
            <h1
              className="text-5xl font-black tracking-[0.3em] mb-3"
              style={{
                color: themeColor,
                textShadow: `0 0 40px ${themeColor}40`,
              }}
            >
              FIN
            </h1>
            <p className="text-white/40 text-sm tracking-widest">
              オルガモン図鑑クエスト
            </p>
          </div>

          {/* Buttons */}
          {showFinButtons && (
            <div
              className="space-y-3 w-56"
              style={{ animation: "fadeSlideUp 0.8s ease-out both" }}
            >
              <button
                onClick={handleGoHome}
                className="w-full py-3 rounded-xl text-sm font-bold text-white tracking-wider transition-all hover:scale-105 active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${themeColor}, ${themeColor}aa)`,
                  boxShadow: `0 4px 20px ${themeColor}40`,
                }}
              >
                🏠 タイトルへ戻る
              </button>
              <button
                onClick={() => {
                  audio.playBGM("map");
                  setScreen("chapter_map");
                }}
                className="w-full py-2.5 rounded-xl text-xs text-white/40 hover:text-white/60 transition-colors"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                🗺️ 冒険を続ける
              </button>
            </div>
          )}
        </div>
      )}

      {/* Global CSS for animations */}
      <style>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
