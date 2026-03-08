import { useState } from "react";
import { useGameStore } from "../stores/gameStore";
import { useMetaStore } from "../stores/metaStore";
import { useCollectionStore } from "../stores/collectionStore";
import { getAllAchievements } from "../logic/achievementLogic";
import { getTitleBonus } from "../logic/titleLogic";
import { getLevelStatBonus } from "../logic/formationLogic";
import { getHeroSkillLoadout, getSkillLearnCostMp } from "../logic/skillLogic";
import { ScreenLayout, GlassCard, PastelButton, ProgressBar, Badge, Modal } from "../components/common";
import heroesData from "../data/heroes.json";
import cardsData from "../data/cards.json";
import type { Hero, Card } from "../types";

const heroes = heroesData as Hero[];
const cards = cardsData as Card[];
const allAchievements = getAllAchievements();

const heroAvatars: Record<string, string> = { minato: "👩‍⚕️", hikari: "🔬", kotoha: "🌿", leon: "💻" };


type Tab = "profile" | "achievements" | "titles" | "skills";

const PAGE_SIZE: Record<Tab, number> = {
  profile: 1,
  achievements: 1,
  titles: 4,
  skills: 1,
};

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "profile", label: "プロフィール", emoji: "👤" },
  { id: "achievements", label: "実績", emoji: "🏆" },
  { id: "titles", label: "称号", emoji: "🏅" },
  { id: "skills", label: "スキル", emoji: "⚡" },
];

const INITIAL_TAB_PAGE: Record<Tab, number> = {
  profile: 0,
  achievements: 0,
  titles: 0,
  skills: 0,
};

export default function ProfileScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const currentRun = useGameStore((s) => s.currentRun);
  const meta = useMetaStore((s) => s.meta);
  const setActiveTitle = useMetaStore((s) => s.setActiveTitle);
  const learnHeroSkill = useGameStore((s) => s.learnHeroSkill);
  const equipHeroSkill = useGameStore((s) => s.equipHeroSkill);
  const collection = useCollectionStore((s) => s.collection);

  const [tab, setTab] = useState<Tab>("profile");
  const [tabPage, setTabPage] = useState<Record<Tab, number>>(INITIAL_TAB_PAGE);
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [skillNotice, setSkillNotice] = useState<string | null>(null);
  const [selectedAchievementId, setSelectedAchievementId] = useState<string | null>(null);

  if (!currentRun) return null;
  const hero = heroes.find((h) => h.id === currentRun.selectedHeroId);
  if (!hero) return null;

  const totalAchs = allAchievements.length;
  const unlockedCount = Object.values(meta.achievements).filter(Boolean).length;
  const completionRate = collection.completionRate;
  const ownedCardIds = Object.keys(currentRun.ownedCards);
  const skillLoadout = getHeroSkillLoadout(hero, currentRun);

  const counts: Record<Tab, number> = {
    profile: 1,
    achievements: allAchievements.length,
    titles: meta.titles.length,
    skills: skillLoadout.allActiveSkills.length,
  };

  const currentPageSize = tab === "achievements" ? Math.max(1, allAchievements.length) : PAGE_SIZE[tab];
  const totalPages = Math.max(1, Math.ceil(counts[tab] / currentPageSize));
  const clampedPage = Math.min(tabPage[tab], totalPages - 1);
  const pageStart = clampedPage * currentPageSize;
  const selectedAchievement = selectedAchievementId
    ? allAchievements.find((achievement) => achievement.id === selectedAchievementId) ?? null
    : null;
  const setEquippedCards = useGameStore((s) => s.setEquippedCards);
  const equippedCardIds = currentRun.equippedCardIds || [];

  const handleSelectFavorite = (cardId: string) => {
    let prev = equippedCardIds;
    if (prev.includes(cardId)) {
      setEquippedCards(prev.filter((c) => c !== cardId));
    } else {
      if (prev.length < 3) {
        setEquippedCards([...prev, cardId]);
      }
    }
  };

  const showSkillNotice = (message: string) => {
    setSkillNotice(message);
    window.setTimeout(() => setSkillNotice(null), 1800);
  };

  const handleLearnSkill = (skillId: string, skillName: string, cost: number) => {
    const learned = learnHeroSkill(skillId, cost);
    if (!learned) {
      showSkillNotice(`MPが足りません（必要 ${cost}MP）`);
      return;
    }
    showSkillNotice(`✨ ${skillName} を習得しました`);
  };

  const handleEquipSkill = (skillId: string, slotIndex: number, skillName: string) => {
    const equipped = equipHeroSkill(skillId, slotIndex);
    if (!equipped) {
      showSkillNotice("装備の更新に失敗しました");
      return;
    }
    showSkillNotice(`🧩 ${skillName} をスロット${slotIndex + 1}に装備`);
  };

  const handleShare = async () => {
    const text = `🎮 オルガモン図鑑クエスト\n👤 ${currentRun.playerName} (${hero.name})\n🏅 ${meta.activeTitle}\n📊 Lv.${currentRun.level} / 図鑑${completionRate}%\n🏆 実績${unlockedCount}/${totalAchs}`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // cancelled
      }
      return;
    }
    await navigator.clipboard.writeText(text);
    alert("プロフィール情報をコピーしました！");
  };

  const updateCurrentTabPage = (next: number) => {
    setTabPage((prev) => ({ ...prev, [tab]: next }));
  };

  const getAchievementRewardLabel = (achievement: (typeof allAchievements)[number]) => {
    if (achievement.reward.type === "mp") return `${achievement.reward.value}MP`;
    if (achievement.reward.type === "title") return `称号「${achievement.reward.value}」`;
    return achievement.reward.value;
  };

  return (
    <ScreenLayout
      onBack={() => setScreen("home")}
      title="プロフィール"
      titleEmoji="🏅"
      accentColor={hero.themeColor}
      padding="compact"
      className="h-[100dvh] flex flex-col pb-[calc(env(safe-area-inset-bottom)+0.25rem)]"
    >
      <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
        <div className="grid grid-cols-4 gap-1 bg-white/40 rounded-xl p-1 shrink-0">
          {TABS.map((entry) => (
            <button
              key={entry.id}
              onClick={() => setTab(entry.id)}
              className={`min-h-11 text-[10px] font-medium rounded-lg transition-all ${tab === entry.id
                ? "glass-strong shadow-sm text-warm-gray"
                : "text-warm-gray/45 hover:text-warm-gray/70"
                }`}
            >
              <div className="leading-none mb-0.5">{entry.emoji}</div>
              <div className="leading-none">{entry.label}</div>
            </button>
          ))}
        </div>

        <GlassCard variant="strong" className="shrink-0 p-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm overflow-hidden border border-white/50 shrink-0"
              style={{ backgroundColor: hero.themeColor + "25" }}
            >
              {hero.imageUrl ? (
                <img src={hero.imageUrl} alt={hero.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">{heroAvatars[hero.id]}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-warm-gray truncate">{currentRun.playerName}</p>
              <p className="text-[11px] text-warm-gray/50 truncate">{hero.profession} Lv.{currentRun.level}</p>
              {(() => {
                const titleBonus = getTitleBonus(meta.activeTitle);
                const levelBonus = getLevelStatBonus(currentRun.level);
                const atk = hero.baseStats.atk + titleBonus.atk + levelBonus.atk;
                const def = hero.baseStats.def + titleBonus.def + levelBonus.def;
                const spd = hero.baseStats.spd + titleBonus.spd + levelBonus.spd;
                return (
                  <p className="text-[10px] text-indigo-500/80 truncate mt-0.5">
                    ATK {atk} / DEF {def} / SPD {spd}
                  </p>
                );
              })()}
            </div>
            <div className="flex flex-col items-end justify-center gap-1.5 shrink-0">
              <Badge variant="warning" size="xs" className="max-w-[100px] truncate">
                {meta.activeTitle}
              </Badge>
              <Badge variant="info" size="xs" className="font-bold">
                MP {currentRun.mp}
              </Badge>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="strong" className="flex-1 min-h-0 p-3 flex flex-col overflow-hidden">
          {tab === "profile" && (
            <div className="flex-1 min-h-0 flex flex-col gap-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-white/60 p-2 text-center">
                  <p className="text-[9px] text-warm-gray/35">図鑑</p>
                  <p className="text-sm font-bold text-warm-gray">{completionRate}%</p>
                </div>
                <div className="rounded-xl bg-white/60 p-2 text-center">
                  <p className="text-[9px] text-warm-gray/35">実績</p>
                  <p className="text-sm font-bold text-warm-gray">{unlockedCount}/{totalAchs}</p>
                </div>
                <div className="rounded-xl bg-white/60 p-2 text-center">
                  <p className="text-[9px] text-warm-gray/35">クリア</p>
                  <p className="text-sm font-bold text-warm-gray">{meta.totalClears}</p>
                </div>
              </div>

              <div className="rounded-xl bg-white/55 border border-white/70 p-2.5 flex-1 min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-bold text-warm-gray">⚔️ 装備カード (バトルATK上昇)</p>
                  <PastelButton
                    onClick={() => setShowCardPicker(true)}
                    variant="primary"
                    gradient="coral"
                    size="sm"
                    className="flex-shrink-0 min-w-[80px]"
                    icon="✏️"
                  >
                    編成
                  </PastelButton>
                </div>
                <div className="grid grid-cols-3 gap-1.5 h-[96px]">
                  {Array.from({ length: 3 }).map((_, index) => {
                    const cardId = equippedCardIds[index];
                    const card = cardId ? cards.find((entry) => entry.id === cardId) : null;
                    const ownedInfo = cardId ? currentRun.ownedCards[cardId] : null;
                    const bonusAtk = (card && ownedInfo)
                      ? Math.round((card.attackPower + (ownedInfo.stage * 10)) * (1.0 + ownedInfo.stage * 0.2) * (ownedInfo.count >= 5 ? 1.5 : ownedInfo.count === 4 ? 1.3 : ownedInfo.count === 3 ? 1.2 : ownedInfo.count === 2 ? 1.1 : 1.0))
                      : 0;

                    return (
                      <div key={index} className="rounded-lg bg-white/65 border border-white/70 p-1 text-center flex flex-col items-center justify-center relative overflow-hidden">
                        {card ? (
                          <>
                            {card.imageUrl && (
                              <img src={card.imageUrl} alt={card.name} className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" />
                            )}
                            <div className="w-10 h-10 mb-0.5 rounded shadow-sm border border-white/50 overflow-hidden bg-white/40 shrink-0 relative z-10">
                              {card.imageUrl ? (
                                <img src={card.imageUrl} alt={card.name} className="w-full h-full object-contain p-0.5" />
                              ) : (
                                <div className="w-full h-full grid place-items-center text-[10px] text-warm-gray/40">Img</div>
                              )}
                            </div>
                            <p className="text-[9px] font-bold text-warm-gray truncate w-full relative z-10 drop-shadow-md">{card.name}</p>
                            <div className="relative z-10 mt-0.5">
                              <Badge variant="warning" size="xs">ATK +{bonusAtk}</Badge>
                            </div>
                          </>
                        ) : (
                          <div className="grid place-items-center w-full h-full">
                            <p className="text-[10px] text-warm-gray/30">未設定</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <PastelButton
                  variant="secondary"
                  size="sm"
                  icon="📋"
                  onClick={async () => {
                    const text = `${currentRun.playerName} | ${hero.name} | Lv.${currentRun.level} | 図鑑${completionRate}% | ${meta.activeTitle}`;
                    try {
                      await navigator.clipboard.writeText(text);
                      alert("コピーしました！");
                    } catch {
                      alert("コピーに失敗しました");
                    }
                  }}
                >
                  コピー
                </PastelButton>
                <PastelButton gradient="coral" size="sm" icon="📤" onClick={handleShare}>
                  共有
                </PastelButton>
              </div>
            </div>
          )}

          {tab === "achievements" && (
            <div className="flex-1 min-h-0 flex flex-col gap-2">
              <GlassCard className="p-2.5 !bg-white/55 shrink-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-warm-gray">解除済み実績</p>
                  <p className="text-base font-bold text-warm-gray">{unlockedCount} / {totalAchs}</p>
                </div>
                <ProgressBar
                  value={unlockedCount}
                  max={totalAchs}
                  gradient="from-coral to-pastel-pink"
                  size="xs"
                  className="mt-2"
                />
              </GlassCard>

              <div
                className="flex-1 min-h-0 grid grid-cols-3 gap-1.5"
                style={{ gridTemplateRows: `repeat(${Math.ceil(allAchievements.length / 3)}, minmax(0, 1fr))` }}
              >
                {allAchievements.map((achievement) => {
                  const unlocked = meta.achievements[achievement.id];
                  const isSecret = achievement.secretFlag && !unlocked;
                  return (
                    <button
                      key={achievement.id}
                      onClick={() => setSelectedAchievementId(achievement.id)}
                      className={`rounded-lg border px-1.5 py-1 text-center transition-all flex flex-col justify-between ${unlocked
                        ? "bg-pastel-green/18 border-green-200/55 hover:bg-pastel-green/28 btn-press"
                        : isSecret
                          ? "bg-gray-100/45 border-white/65 opacity-45"
                          : "bg-white/72 border-white/80 hover:bg-white/90 btn-press"
                        }`}
                    >
                      <p className="text-base leading-none">
                        {unlocked ? "🏆" : isSecret ? "❓" : "🔒"}
                      </p>
                      <p className="text-[9px] font-bold text-warm-gray truncate">
                        {isSecret ? "???" : achievement.name}
                      </p>
                      <p className="text-[8px] text-warm-gray/45">{unlocked ? "達成" : "未達成"}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "titles" && (
            <div className="flex-1 min-h-0 flex flex-col gap-2">
              <GlassCard className="p-2.5 !bg-white/55 shrink-0">
                <p className="text-[10px] text-warm-gray/40">現在の称号</p>
                <p className="text-sm font-bold text-warm-gray truncate">🏅 {meta.activeTitle}</p>
              </GlassCard>

              <div
                className="flex-1 min-h-0 grid gap-2"
                style={{ gridTemplateRows: `repeat(${PAGE_SIZE.titles}, minmax(0, 1fr))` }}
              >
                {meta.titles.slice(pageStart, pageStart + PAGE_SIZE.titles).map((title) => {
                  const titleBonus = getTitleBonus(title);
                  const isActive = meta.activeTitle === title;
                  return (
                    <button
                      key={title}
                      onClick={() => setActiveTitle(title)}
                      className={`text-left rounded-xl border p-2.5 transition-all ${isActive
                        ? "bg-coral/12 border-coral/35"
                        : "bg-white/70 border-white/75 hover:bg-white/85 btn-press"
                        }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base shrink-0">{isActive ? "👑" : "🏅"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-warm-gray truncate">{title}</p>
                          <p className="text-[10px] text-warm-gray/45 truncate">
                            ATK +{titleBonus.atk} / DEF +{titleBonus.def} / SPD +{titleBonus.spd}
                          </p>
                        </div>
                        {isActive && <Badge variant="warning" size="xs">装備中</Badge>}
                      </div>
                    </button>
                  );
                })}

                {Array.from({
                  length: Math.max(0, PAGE_SIZE.titles - meta.titles.slice(pageStart, pageStart + PAGE_SIZE.titles).length),
                }).map((_, index) => (
                  <div
                    key={`title-empty-${index}`}
                    className="rounded-xl border-2 border-dashed border-white/55 bg-white/20 grid place-items-center text-[11px] text-warm-gray/30"
                  >
                    称号なし
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "skills" && (
            <div className="flex-1 min-h-0 flex flex-col gap-2 relative">
              {skillNotice && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 w-full max-w-[200px] text-center rounded-lg bg-pastel-yellow/95 px-3 py-1.5 text-[11px] font-bold text-amber-700 shadow-sm animate-pop">
                  {skillNotice}
                </div>
              )}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 pb-1">
                {skillLoadout.allActiveSkills.map((skill) => {
                  const isLearned = skillLoadout.learnedSkillIds.includes(skill.id);
                  const equippedSlot = skillLoadout.equippedSkillIds.indexOf(skill.id);
                  const learnCost = getSkillLearnCostMp(skill);
                  const canLearn = currentRun.mp >= learnCost;
                  const isStarter = hero.skills.some((starter) => starter.id === skill.id);

                  return (
                    <div key={skill.id} className={`rounded-xl border p-2 flex flex-col transition-all ${equippedSlot >= 0 ? "bg-pastel-green/20 border-green-300" : "bg-white/70 border-white/75"}`}>
                      <div className="flex items-start gap-2 mb-1.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] shrink-0"
                          style={{ backgroundColor: hero.themeColor }}
                        >
                          ⚡
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <p className="font-bold text-xs text-warm-gray truncate">{skill.name}</p>
                            {equippedSlot >= 0 ? (
                              <Badge variant="success" size="xs">装備中 S{equippedSlot + 1}</Badge>
                            ) : isLearned ? (
                              <Badge variant="info" size="xs">習得済み</Badge>
                            ) : (
                              <Badge variant="danger" size="xs">未習得</Badge>
                            )}
                            {isStarter && <Badge variant="warning" size="xs">初期</Badge>}
                          </div>
                          <p className="text-[10px] text-warm-gray/50 line-clamp-2 leading-tight">{skill.description}</p>
                        </div>
                      </div>

                      {!isLearned ? (
                        <button
                          onClick={() => handleLearnSkill(skill.id, skill.name, learnCost)}
                          disabled={!canLearn}
                          className={`mt-1 min-h-8 text-[11px] rounded-lg font-bold transition-all ${canLearn
                            ? "bg-coral/15 text-coral hover:bg-coral/25 btn-press"
                            : "bg-gray-100/80 text-warm-gray/35"
                            }`}
                        >
                          {canLearn ? `習得する (${learnCost}MP)` : `MP不足 (${learnCost}MP)`}
                        </button>
                      ) : (
                        <div className="mt-1 flex gap-1.5">
                          {Array.from({ length: skillLoadout.skillSetMax }).map((_, slotIndex) => {
                            const active = equippedSlot === slotIndex;
                            return (
                              <button
                                key={slotIndex}
                                onClick={() => handleEquipSkill(skill.id, slotIndex, skill.name)}
                                className={`flex-1 min-h-7 text-[10px] rounded-lg font-bold transition-all border ${active
                                  ? "bg-pastel-green/40 text-green-700 border-green-400 shadow-sm"
                                  : "bg-indigo-50/50 text-indigo-500 hover:bg-indigo-100 btn-press border-indigo-100/50"
                                  }`}
                              >
                                S{slotIndex + 1}に装備
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}



          {tab !== "profile" && tab !== "skills" && totalPages > 1 && (
            <div className="mt-2 shrink-0 flex items-center gap-2">
              <button
                onClick={() =>
                  updateCurrentTabPage(Math.max(0, Math.min(tabPage[tab], totalPages - 1) - 1))
                }
                disabled={clampedPage === 0}
                className={`flex-1 min-h-10 rounded-lg text-sm font-bold ${clampedPage === 0
                  ? "bg-gray-100 text-warm-gray/30"
                  : "bg-indigo-100/70 text-indigo-700 btn-press"
                  }`}
              >
                ← 前へ
              </button>
              <p className="text-[11px] text-warm-gray/50 shrink-0 min-w-20 text-center">
                {clampedPage + 1}/{totalPages} ページ
              </p>
              <button
                onClick={() =>
                  updateCurrentTabPage(Math.min(totalPages - 1, Math.min(tabPage[tab], totalPages - 1) + 1))
                }
                disabled={clampedPage >= totalPages - 1}
                className={`flex-1 min-h-10 rounded-lg text-sm font-bold ${clampedPage >= totalPages - 1
                  ? "bg-gray-100 text-warm-gray/30"
                  : "bg-indigo-100/70 text-indigo-700 btn-press"
                  }`}
              >
                次へ →
              </button>
            </div>
          )}
        </GlassCard>
      </div>

      <Modal
        open={!!selectedAchievement}
        onClose={() => setSelectedAchievementId(null)}
        position="bottom"
        showHandle
      >
        {selectedAchievement && (
          <div>
            {(() => {
              const unlocked = meta.achievements[selectedAchievement.id];
              const isSecret = selectedAchievement.secretFlag && !unlocked;
              return (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-white/70 flex items-center justify-center text-2xl shrink-0">
                      {unlocked ? "🏆" : isSecret ? "❓" : "🔒"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-warm-gray truncate">
                        {isSecret ? "???" : selectedAchievement.name}
                      </p>
                      <p className="text-[11px] text-warm-gray/45">
                        {unlocked ? "✅ 解除済み" : "未解除"}
                      </p>
                    </div>
                  </div>

                  <GlassCard className="p-3 !bg-white/55">
                    <p className="text-[11px] text-warm-gray/60 leading-relaxed">
                      {isSecret ? "シークレット実績です。条件を満たすと内容が表示されます。" : selectedAchievement.description}
                    </p>
                    {!isSecret && (
                      <p className="text-[11px] text-amber-700/85 mt-2">
                        報酬: {getAchievementRewardLabel(selectedAchievement)}
                      </p>
                    )}
                  </GlassCard>
                </>
              );
            })()}
          </div>
        )}
      </Modal>

      <Modal open={showCardPicker} onClose={() => setShowCardPicker(false)} position="bottom" showHandle>
        <div>
          <p className="text-sm font-bold text-warm-gray mb-1">装備カードを選択（最大3枚）</p>
          <p className="text-[11px] text-warm-gray/45 mb-3">所持数（最大5）が多いほどステータスが上がります。</p>

          {ownedCardIds.length === 0 ? (
            <div className="rounded-xl bg-white/55 border border-white/70 p-4 text-center text-sm text-warm-gray/45">
              所持カードがありません
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto rounded-xl bg-white/45 border border-white/70 p-2">
              <div className="flex flex-col gap-1.5">
                {ownedCardIds.map((cardId) => {
                  const card = cards.find((entry) => entry.id === cardId);
                  if (!card) return null;
                  const isFav = equippedCardIds.includes(cardId);

                  const ownedInfo = currentRun.ownedCards[cardId];
                  const bonusAtk = Math.round((card.attackPower + (ownedInfo.stage * 10)) * (1.0 + ownedInfo.stage * 0.2) * (ownedInfo.count >= 5 ? 1.5 : ownedInfo.count === 4 ? 1.3 : ownedInfo.count === 3 ? 1.2 : ownedInfo.count === 2 ? 1.1 : 1.0));

                  return (
                    <button
                      key={cardId}
                      onClick={() => handleSelectFavorite(cardId)}
                      className={`text-left w-full px-3 py-2 rounded-lg transition-all btn-press border flex items-center justify-between ${isFav
                        ? "bg-coral/15 border-coral/50 text-warm-gray font-bold shadow-sm"
                        : "bg-white/70 border-white/80 text-warm-gray/70 hover:bg-white/90"
                        }`}
                    >
                      <div className="flex flex-col min-w-0 flex-1 pr-2">
                        <span className="text-xs truncate font-bold">{card.name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                          <span className={ownedInfo.count >= 5 ? "text-coral font-bold" : "text-emerald-600 font-bold"}>所持 {ownedInfo.count}枚</span>
                          <span className="text-indigo-600">★{ownedInfo.stage}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <Badge variant={isFav ? "info" : "default"} size="sm">
                          ATK +{bonusAtk}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <PastelButton fullWidth size="sm" variant="secondary" className="mt-3" onClick={() => setShowCardPicker(false)}>
            閉じる
          </PastelButton>
        </div>
      </Modal>
    </ScreenLayout>
  );
}
