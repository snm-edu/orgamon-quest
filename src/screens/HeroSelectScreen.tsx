import { useState } from "react";
import { useGameStore } from "../stores/gameStore";
import { ScreenLayout, GlassCard, PastelButton, Badge } from "../components/common";
import heroesData from "../data/heroes.json";
import type { Hero, HeroId } from "../types";

import minatoImg from "../assets/characters/minato.png";
import hikariImg from "../assets/characters/hikari.png";
import kotohaImg from "../assets/characters/kotoha.png";
import leonImg from "../assets/characters/leon.png";

const heroes = heroesData as Hero[];

const heroImages: Record<string, string> = {
  minato: minatoImg,
  hikari: hikariImg,
  kotoha: kotohaImg,
  leon: leonImg,
};

type HeroGradient = "coral" | "lavender" | "mint" | "sky";
type DetailPage = "overview" | "skills" | "ultimate";

const heroGradients: Record<HeroId, HeroGradient> = {
  minato: "coral",
  hikari: "lavender",
  kotoha: "mint",
  leon: "sky",
};

const DETAIL_PAGES: { id: DetailPage; label: string }[] = [
  { id: "overview", label: "概要" },
  { id: "skills", label: "スキル" },
  { id: "ultimate", label: "必殺/パッシブ" },
];

export default function HeroSelectScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const setPendingHeroId = useGameStore((s) => s.setPendingHeroId);
  const [selectedId, setSelectedId] = useState<HeroId | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailPage, setDetailPage] = useState(0);

  const selectedHero = heroes.find((h) => h.id === selectedId);
  const clampedDetailPage = Math.min(detailPage, DETAIL_PAGES.length - 1);
  const currentDetailPage = DETAIL_PAGES[clampedDetailPage].id;

  const handleSelect = (id: HeroId) => {
    setSelectedId(id);
    setShowDetail(true);
    setDetailPage(0);
  };

  const handleConfirm = () => {
    if (selectedId) {
      setPendingHeroId(selectedId);
      setScreen("player_name");
    }
  };

  return (
    <ScreenLayout
      onBack={() => (showDetail ? setShowDetail(false) : setScreen("title"))}
      title="主人公をえらぼう"
      titleEmoji="🌟"
      padding="compact"
      className="h-[100dvh] flex flex-col pb-[calc(env(safe-area-inset-bottom)+0.25rem)]"
    >
      <div className="flex-1 min-h-0">
        {!showDetail ? (
          <div className="h-full grid grid-cols-2 gap-2">
            {heroes.map((hero, idx) => (
              <GlassCard
                key={hero.id}
                variant="strong"
                onClick={() => handleSelect(hero.id as HeroId)}
                className={`p-3 h-full text-center animate-slide-up border-2 transition-all ${selectedId === hero.id ? "border-current shadow-lg" : "border-transparent"
                  }`}
                style={{
                  animationDelay: `${idx * 0.06}s`,
                  borderColor: selectedId === hero.id ? hero.themeColor : "transparent",
                }}
              >
                <div
                  className="w-28 h-28 rounded-2xl mx-auto mb-2 flex items-center justify-center overflow-hidden shadow-md"
                  style={{ backgroundColor: hero.themeColor + "15" }}
                >
                  <img
                    src={heroImages[hero.id]}
                    alt={hero.name}
                    className="w-full h-full object-cover rounded-2xl animate-float-slow"
                  />
                </div>
                <h3 className="font-bold text-warm-gray text-sm mb-0.5 truncate">{hero.name}</h3>
                <p className="text-[10px] text-warm-gray/50 truncate">{hero.profession}</p>
                <div className="w-10 h-1 rounded-full mx-auto mt-1.5" style={{ backgroundColor: hero.themeColor }} />
              </GlassCard>
            ))}
          </div>
        ) : (
          selectedHero && (
            <div className="h-full animate-pop">
              <GlassCard variant="strong" className="h-full p-3 flex flex-col" accentColor={selectedHero.themeColor}>
                <div className="text-center mb-2.5 shrink-0">
                  <div
                    className="w-24 h-24 rounded-full mx-auto mb-1.5 overflow-hidden shadow-lg animate-float"
                    style={{
                      backgroundColor: selectedHero.themeColor + "15",
                      boxShadow: `0 4px 20px ${selectedHero.themeColor}40`,
                    }}
                  >
                    <img
                      src={heroImages[selectedHero.id]}
                      alt={selectedHero.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h2 className="text-lg font-extrabold text-warm-gray">{selectedHero.name}</h2>
                  <p className="text-[11px] text-warm-gray/55">{selectedHero.profession}</p>
                </div>

                <div className="rounded-xl bg-white/45 border border-white/70 p-2.5 flex-1 min-h-0">
                  {currentDetailPage === "overview" && (
                    <div className="h-full flex flex-col gap-2">
                      <p className="text-[11px] text-warm-gray/70 leading-relaxed">{selectedHero.concept}</p>
                      <div className="rounded-lg bg-white/60 p-2">
                        <p className="text-[10px] font-bold text-warm-gray/50 mb-1">進化ライン</p>
                        <div className="flex items-center gap-1 text-[10px] flex-wrap">
                          {selectedHero.evolutionLine.map((stage, i) => (
                            <span key={i} className="flex items-center gap-1">
                              <span className="glass-strong px-2 py-0.5 rounded-lg font-medium text-warm-gray">
                                {stage}
                              </span>
                              {i < selectedHero.evolutionLine.length - 1 && <span className="text-warm-gray/30">→</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 mt-auto">
                        <div className="rounded-lg bg-white/60 p-2 text-center">
                          <p className="text-[9px] text-warm-gray/40">ATK</p>
                          <p className="text-sm font-bold text-warm-gray">{selectedHero.baseStats.atk}</p>
                        </div>
                        <div className="rounded-lg bg-white/60 p-2 text-center">
                          <p className="text-[9px] text-warm-gray/40">DEF</p>
                          <p className="text-sm font-bold text-warm-gray">{selectedHero.baseStats.def}</p>
                        </div>
                        <div className="rounded-lg bg-white/60 p-2 text-center">
                          <p className="text-[9px] text-warm-gray/40">SPD</p>
                          <p className="text-sm font-bold text-warm-gray">{selectedHero.baseStats.spd}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentDetailPage === "skills" && (
                    <div className="h-full grid grid-rows-2 gap-2">
                      {selectedHero.skills.slice(0, 2).map((skill) => (
                        <div key={skill.id} className="bg-white/60 rounded-xl p-2 flex items-start gap-2">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                            style={{ backgroundColor: selectedHero.themeColor }}
                          >
                            CD{skill.cooldown}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-warm-gray truncate">{skill.name}</p>
                            <p className="text-[10px] text-warm-gray/50 leading-relaxed">{skill.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {currentDetailPage === "ultimate" && (
                    <div className="h-full flex flex-col gap-2">
                      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-2.5 border border-amber-200/50">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="text-sm">🌈</span>
                          <p className="font-bold text-sm text-warm-gray">{selectedHero.ultimate.name}</p>
                          <Badge variant="warning" size="xs">チャージ {selectedHero.ultimate.chargeRequired}問</Badge>
                        </div>
                        <p className="text-[10px] text-warm-gray/55 leading-relaxed">
                          {selectedHero.ultimate.description}
                        </p>
                      </div>

                      <div className="bg-white/55 rounded-xl p-2.5 border border-white/70">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="text-sm">🔮</span>
                          <p className="font-bold text-sm text-warm-gray">{selectedHero.passive.name}</p>
                          <Badge variant="success" size="xs">パッシブ</Badge>
                        </div>
                        <p className="text-[10px] text-warm-gray/55 leading-relaxed">
                          {selectedHero.passive.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="shrink-0 mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDetailPage((prev) => Math.max(0, Math.min(prev, DETAIL_PAGES.length - 1) - 1))}
                      disabled={clampedDetailPage === 0}
                      className={`flex-1 min-h-8 rounded-lg text-[11px] font-bold ${clampedDetailPage === 0
                        ? "bg-gray-100 text-warm-gray/30"
                        : "bg-indigo-100/70 text-indigo-700 btn-press"
                        }`}
                    >
                      ← 前へ
                    </button>
                    <p className="text-[10px] text-warm-gray/45 min-w-20 text-center">
                      {DETAIL_PAGES[clampedDetailPage].label}
                    </p>
                    <button
                      onClick={() => setDetailPage((prev) => Math.min(DETAIL_PAGES.length - 1, Math.min(prev, DETAIL_PAGES.length - 1) + 1))}
                      disabled={clampedDetailPage >= DETAIL_PAGES.length - 1}
                      className={`flex-1 min-h-8 rounded-lg text-[11px] font-bold ${clampedDetailPage >= DETAIL_PAGES.length - 1
                        ? "bg-gray-100 text-warm-gray/30"
                        : "bg-indigo-100/70 text-indigo-700 btn-press"
                        }`}
                    >
                      次へ →
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <PastelButton
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => setShowDetail(false)}
                    >
                      ← もどる
                    </PastelButton>
                    <PastelButton
                      gradient={heroGradients[selectedHero.id]}
                      size="sm"
                      className="flex-1"
                      onClick={handleConfirm}
                    >
                      この子で決定！
                    </PastelButton>
                  </div>
                </div>
              </GlassCard>
            </div>
          )
        )}
      </div>
    </ScreenLayout>
  );
}
