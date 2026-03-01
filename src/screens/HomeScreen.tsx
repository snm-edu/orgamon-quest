import { useState, useEffect } from "react";
import { useGameStore } from "../stores/gameStore";
import { useDailyStore } from "../stores/dailyStore";
import { getDayOfWeekDropBoost, getChapterName, getLoginBonusSchedule } from "../logic/dailyLogic";
import { getAllCards } from "../logic/captureLogic";
import { getAllCompanions } from "../logic/companionLogic";
import { ScreenLayout, GlassCard, PastelButton, ProgressBar, StatCard, Badge, Modal } from "../components/common";
import heroesData from "../data/heroes.json";
import type { Hero } from "../types";

import minatoImg from "../assets/characters/minato.png";
import hikariImg from "../assets/characters/hikari.png";
import kotohaImg from "../assets/characters/kotoha.png";
import leonImg from "../assets/characters/leon.png";
import mikotoImg from "../assets/characters/mikoto.png";

const heroes = heroesData as Hero[];
const MISSIONS_PER_PAGE = 2;

const heroImages: Record<string, string> = {
  minato: minatoImg,
  hikari: hikariImg,
  kotoha: kotohaImg,
  leon: leonImg,
};

type HomePanel = "overview" | "support" | "daily";

const PANELS: { id: HomePanel; label: string; emoji: string }[] = [
  { id: "overview", label: "全体", emoji: "📊" },
  { id: "support", label: "サポート", emoji: "👥" },
  { id: "daily", label: "デイリー", emoji: "📋" },
];

export default function HomeScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const currentRun = useGameStore((s) => s.currentRun);
  const addMP = useGameStore((s) => s.addMP);
  const addItem = useGameStore((s) => s.addItem);
  const addCard = useGameStore((s) => s.addCard);
  const addCompanion = useGameStore((s) => s.addCompanion);

  const checkLogin = useDailyStore((s) => s.checkLogin);
  const claimLoginBonus = useDailyStore((s) => s.claimLoginBonus);
  const daily = useDailyStore((s) => s.daily);
  const claimMissionReward = useDailyStore((s) => s.claimMissionReward);

  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [loginInfo, setLoginInfo] = useState<{ streak: number; bonusDay: number } | null>(null);
  const [claimedBonus, setClaimedBonus] = useState<{ label: string } | null>(null);
  const [showBonusCalendar, setShowBonusCalendar] = useState(false);
  const [panelPage, setPanelPage] = useState(0);
  const [missionPage, setMissionPage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const result = checkLogin();
      if (result.isNewDay) {
        setLoginInfo({ streak: result.streak, bonusDay: result.bonusDay });
        setShowLoginPopup(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [checkLogin]);

  if (!currentRun) return null;

  const hero = heroes.find((h) => h.id === currentRun.selectedHeroId);
  if (!hero) return null;

  const xpToNext = 100 - (currentRun.totalXP % 100);
  const xpProgress = currentRun.totalXP % 100;
  const ownedCardsCount = Object.keys(currentRun.ownedCards).length;
  const companionCount = currentRun.ownedCompanions.length;
  const dropBoost = getDayOfWeekDropBoost();

  const totalPanelPages = PANELS.length;
  const clampedPanelPage = Math.min(panelPage, totalPanelPages - 1);
  const currentPanel = PANELS[clampedPanelPage]?.id ?? "overview";

  const totalMissionPages = Math.max(1, Math.ceil(Math.max(daily.missions.length, 1) / MISSIONS_PER_PAGE));
  const clampedMissionPage = Math.min(missionPage, totalMissionPages - 1);
  const missionStart = clampedMissionPage * MISSIONS_PER_PAGE;
  const visibleMissions = daily.missions.slice(missionStart, missionStart + MISSIONS_PER_PAGE);

  const handleClaimLoginBonus = () => {
    const bonus = claimLoginBonus();
    if (bonus) {
      if (bonus.type === "mp") addMP(bonus.amount);
      else if (bonus.type === "item" && bonus.value) addItem(bonus.value, bonus.amount);
      else if (bonus.type === "card" && bonus.value === "rare_guaranteed") {
        const rareOrBetter = getAllCards().filter((card) => card.rarity !== "Common");
        const pool = rareOrBetter.length > 0 ? rareOrBetter : getAllCards();
        if (pool.length > 0) {
          const picked = pool[Math.floor(Math.random() * pool.length)];
          addCard(picked.id);
        }
      } else if (bonus.type === "companion" && bonus.value === "epic_companion_guaranteed") {
        const epicPool = getAllCompanions().filter((c) => c.rarity === "Epic");
        const pool = epicPool.length > 0 ? epicPool : getAllCompanions();
        if (pool.length > 0) {
          const picked = pool[Math.floor(Math.random() * pool.length)];
          addCompanion({ ...picked, level: 1, exp: 0, evolutionStage: 0 });
        }
      }
      setClaimedBonus({ label: bonus.label });
    }
    setTimeout(() => {
      setShowLoginPopup(false);
      setClaimedBonus(null);
    }, 1500);
  };

  const handleClaimMission = (index: number) => {
    const reward = claimMissionReward(index);
    if (reward) {
      addMP(reward.mp);
      if (reward.itemId) addItem(reward.itemId, 1);
    }
  };

  const renderOverviewPanel = () => (
    <div className="h-full flex flex-col gap-2">
      <ProgressBar
        value={xpProgress}
        max={100}
        gradient="from-coral to-pastel-pink"
        size="xs"
      />

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white/55 border border-white/70 p-2.5">
          <p className="text-[10px] text-warm-gray/40">カード</p>
          <p className="text-sm font-bold text-warm-gray">{ownedCardsCount}枚</p>
        </div>
        <div className="rounded-xl bg-white/55 border border-white/70 p-2.5">
          <p className="text-[10px] text-warm-gray/40">仲間</p>
          <p className="text-sm font-bold text-warm-gray">{companionCount}体</p>
        </div>
      </div>

      <div className="rounded-xl bg-white/55 border border-white/70 p-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-bold text-warm-gray">💓 ホメオスタシス</span>
          <span className="text-sm font-bold" style={{ color: hero.themeColor }}>
            {currentRun.homeostasis}/100
          </span>
        </div>
        <ProgressBar
          value={currentRun.homeostasis}
          max={100}
          color={
            currentRun.homeostasis >= 70
              ? "#98d4bb"
              : currentRun.homeostasis >= 40
                ? "#f0c040"
                : "#f08080"
          }
          size="xs"
        />
        <p className="text-[10px] text-warm-gray/40 mt-1">次のレベルまで {xpToNext}XP</p>
      </div>

      <div className="rounded-xl bg-white/45 border border-white/65 p-2 min-h-[58px]">
        <p className="text-[10px] font-bold text-warm-gray/55 mb-1">⚠️ 状態異常</p>
        {currentRun.debuffs.length > 0 ? (
          <div className="flex gap-1 flex-wrap">
            {currentRun.debuffs.map((d, i) => (
              <Badge key={i} variant="danger" size="xs">
                {debuffLabel(d.type)} ({d.duration}T)
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-warm-gray/35">異常なし</p>
        )}
      </div>
    </div>
  );

  const renderSupportPanel = () => (
    <div className="h-full flex flex-col gap-2">
      <div className="rounded-xl bg-white/55 border border-white/70 p-2.5">
        <div className="flex items-start gap-2">
          <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm shrink-0">
            <img src={mikotoImg} alt="ミコト先輩" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-warm-gray/40 font-bold mb-0.5">ミコト先輩</p>
            <p className="text-[11px] text-warm-gray/70 leading-relaxed">
              {getMikotoMessage(currentRun.playerName, hero.name, currentRun.level, ownedCardsCount, companionCount)}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white/55 border border-white/70 p-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[11px] font-bold text-warm-gray/60">
            👥 チーム ({currentRun.team.length + 1}/3)
          </p>
          <button
            onClick={() => setScreen("team_edit")}
            className="text-[10px] text-coral font-medium"
          >
            編成変更
          </button>
        </div>
        {currentRun.team.length > 0 ? (
          <div className="flex gap-1.5 flex-wrap">
            {currentRun.team.map((c) => (
              <Badge key={c.id} variant="default" size="xs">
                {c.name} Lv.{c.level}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-warm-gray/35">仲間を追加して編成しよう</p>
        )}
      </div>

      <div className="rounded-xl bg-gradient-to-r from-pastel-yellow/30 to-pastel-pink/20 border border-white/70 p-2.5">
        <p className="text-[11px] font-bold text-warm-gray mb-1">
          📅 {dropBoost.isSunday ? "日曜ボーナス！全章1.5倍" : `${dropBoost.dayLabel}曜限定ドロップ2倍`}
        </p>
        <div className="flex gap-1 flex-wrap">
          {dropBoost.boostedChapters.map((ch) => (
            <Badge key={ch} variant="default" size="xs">
              Ch.{ch} {getChapterName(ch)}
            </Badge>
          ))}
          <Badge variant="warning" size="xs">×{dropBoost.multiplier}</Badge>
        </div>
      </div>
    </div>
  );

  const renderDailyPanel = () => (
    <div className="h-full flex flex-col gap-2">
      <div className="rounded-xl bg-white/55 border border-white/70 p-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-bold text-warm-gray">📋 デイリー進行</p>
          <Badge variant="warning" size="xs">{daily.loginStreak}日連続</Badge>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-warm-gray/45">ログイン Day {daily.loginBonusDay}/14</p>
          <button
            onClick={() => setShowBonusCalendar(true)}
            className="text-[10px] text-coral font-medium"
          >
            カレンダー
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-rows-2 gap-2">
        {visibleMissions.map((m, index) => {
          const missionIndex = missionStart + index;
          return (
            <div
              key={`${m.templateId}-${missionIndex}`}
              className={`rounded-xl border p-2.5 ${m.claimed
                  ? "bg-gray-50/65 opacity-55 border-white/60"
                  : m.completed
                    ? "bg-pastel-green/18 border-green-200/55"
                    : "bg-white/65 border-white/70"
                }`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className={`text-[11px] font-medium ${m.claimed ? "text-warm-gray/40 line-through" : "text-warm-gray"}`}>
                    {m.description}
                  </p>
                  <ProgressBar
                    value={m.progress}
                    max={m.target}
                    color={m.completed ? "#98d4bb" : "#f0a0a0"}
                    size="xs"
                    className="mt-1"
                  />
                </div>
                <div className="shrink-0 text-right">
                  {m.completed && !m.claimed ? (
                    <button
                      onClick={() => handleClaimMission(missionIndex)}
                      className="text-[10px] bg-gradient-to-r from-coral to-pastel-pink text-white px-2.5 py-1 rounded-lg font-bold btn-press"
                    >
                      受取
                    </button>
                  ) : m.claimed ? (
                    <span className="text-[10px] text-warm-gray/35">✓済</span>
                  ) : (
                    <span className="text-[10px] text-warm-gray/40">+{m.reward.mp}MP</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {visibleMissions.length < MISSIONS_PER_PAGE &&
          Array.from({ length: MISSIONS_PER_PAGE - visibleMissions.length }).map((_, index) => (
            <div
              key={`mission-empty-${index}`}
              className="rounded-xl border-2 border-dashed border-white/55 bg-white/20 grid place-items-center text-[11px] text-warm-gray/30"
            >
              ミッションなし
            </div>
          ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setMissionPage((prev) => Math.max(0, Math.min(prev, totalMissionPages - 1) - 1))}
          disabled={clampedMissionPage === 0}
          className={`flex-1 min-h-9 rounded-lg text-[11px] font-bold ${clampedMissionPage === 0
              ? "bg-gray-100 text-warm-gray/30"
              : "bg-indigo-100/70 text-indigo-700 btn-press"
            }`}
        >
          ← 前へ
        </button>
        <p className="text-[10px] text-warm-gray/45 min-w-16 text-center">
          {clampedMissionPage + 1}/{totalMissionPages}
        </p>
        <button
          onClick={() => setMissionPage((prev) => Math.min(totalMissionPages - 1, Math.min(prev, totalMissionPages - 1) + 1))}
          disabled={clampedMissionPage >= totalMissionPages - 1}
          className={`flex-1 min-h-9 rounded-lg text-[11px] font-bold ${clampedMissionPage >= totalMissionPages - 1
              ? "bg-gray-100 text-warm-gray/30"
              : "bg-indigo-100/70 text-indigo-700 btn-press"
            }`}
        >
          次へ →
        </button>
      </div>
    </div>
  );

  return (
    <ScreenLayout bgImage="/images/backgrounds/home_bg.webp"
      accentColor={hero.themeColor}
      padding="compact"
      className="h-[100dvh] flex flex-col pb-[calc(env(safe-area-inset-bottom)+0.25rem)]"
    >
      <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-10 h-10 rounded-full overflow-hidden shadow-sm"
              style={{ backgroundColor: hero.themeColor + "15" }}
            >
              <img src={heroImages[hero.id]} alt={hero.name} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-warm-gray truncate">{currentRun.playerName}</p>
              <p className="text-[10px] text-warm-gray/50 truncate">Lv.{currentRun.level} {hero.name}</p>
            </div>
          </div>
          <button
            onClick={() => setScreen("settings")}
            className="w-9 h-9 glass rounded-full flex items-center justify-center shadow-sm btn-press shrink-0"
          >
            ⚙️
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <StatCard label="XP" value={currentRun.totalXP} subLabel={`次まで${xpToNext}`} />
          <StatCard label="MP" value={currentRun.mp} icon="💰" subLabel="ポイント" />
          <StatCard label="欠片" value={currentRun.fragments} icon="🔮" subLabel="知識の欠片" />
        </div>

        <GlassCard variant="strong" className="flex-1 min-h-0 p-3 flex flex-col overflow-hidden">
          <div className="grid grid-cols-3 gap-1 mb-2">
            {PANELS.map((panel, index) => (
              <button
                key={panel.id}
                onClick={() => setPanelPage(index)}
                className={`min-h-9 rounded-lg text-[11px] font-bold transition-all ${clampedPanelPage === index
                    ? "bg-indigo-100/70 text-indigo-700"
                    : "bg-white/55 text-warm-gray/55 hover:bg-white/70"
                  }`}
              >
                {panel.emoji} {panel.label}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0">
            {currentPanel === "overview" && renderOverviewPanel()}
            {currentPanel === "support" && renderSupportPanel()}
            {currentPanel === "daily" && renderDailyPanel()}
          </div>
        </GlassCard>

        <div className="shrink-0 space-y-2">
          <PastelButton
            fullWidth
            size="sm"
            gradient="coral"
            icon="🗺️"
            onClick={() => setScreen("chapter_map")}
          >
            章マップへ
          </PastelButton>

          <div className="grid grid-cols-4 gap-2">
            {[
              { screen: "team_edit" as const, icon: "👥", label: "チーム" },
              { screen: "zukan" as const, icon: "📚", label: "図鑑" },
              { screen: "shop" as const, icon: "🛍️", label: "ショップ" },
              { screen: "profile" as const, icon: "🏅", label: "実績" },
            ].map(({ screen, icon, label }) => (
              <button
                key={screen}
                onClick={() => setScreen(screen)}
                className="py-2.5 glass rounded-xl text-warm-gray font-medium shadow-sm transition-all text-sm btn-press flex flex-col items-center gap-0.5"
              >
                <span className="text-base leading-none">{icon}</span>
                <span className="text-[10px] text-warm-gray/50">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Modal open={showBonusCalendar} onClose={() => setShowBonusCalendar(false)} position="bottom" showHandle>
        <div>
          <p className="text-sm font-bold text-warm-gray mb-2">ログインボーナスカレンダー</p>
          <div className="grid grid-cols-7 gap-1">
            {getLoginBonusSchedule().map((b) => (
              <div
                key={b.day}
                className={`text-center p-1 rounded-lg text-[9px] transition-all ${b.day <= daily.loginBonusDay
                    ? "bg-pastel-green/30 text-green-700"
                    : b.day === daily.loginBonusDay + 1
                      ? "bg-coral/15 text-coral font-bold ring-1 ring-coral/30"
                      : "bg-gray-100/60 text-warm-gray/30"
                  }`}
              >
                <p className="font-bold">{b.day}日</p>
                <p className="truncate">
                  {b.type === "mp" ? `${b.amount}MP` : b.day === 7 ? "Rare" : b.day === 14 ? "Epic" : "🎁"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <Modal open={showLoginPopup && !!loginInfo} onClose={() => setShowLoginPopup(false)}>
        {claimedBonus ? (
          <div className="text-center py-4">
            <div className="text-6xl mb-3 animate-pop">🎉</div>
            <p className="text-lg font-bold text-warm-gray mb-2">ゲット！</p>
            <p className="text-sm text-coral font-bold">{claimedBonus.label}</p>
          </div>
        ) : loginInfo ? (
          <div className="text-center py-2">
            <div className="text-6xl mb-3 animate-float">🌟</div>
            <p className="text-lg font-bold text-warm-gray mb-1">ログインボーナス！</p>
            <p className="text-sm text-warm-gray/50 mb-0.5">{loginInfo.streak}日連続ログイン</p>
            <p className="text-[11px] text-warm-gray/30 mb-5">Day {loginInfo.bonusDay} / 14</p>
            <PastelButton
              fullWidth
              gradient="coral"
              icon="🎁"
              onClick={handleClaimLoginBonus}
            >
              ボーナスを受け取る
            </PastelButton>
            <button
              onClick={() => setShowLoginPopup(false)}
              className="mt-3 text-xs text-warm-gray/30 hover:text-warm-gray/50 transition-colors"
            >
              あとで受け取る
            </button>
          </div>
        ) : null}
      </Modal>
    </ScreenLayout>
  );
}

function debuffLabel(type: string): string {
  switch (type) {
    case "observation_miss":
      return "👁️ 観察漏れ";
    case "misinformation":
      return "❌ 誤情報";
    case "time_pressure":
      return "⏰ 時間圧";
    case "equipment_malfunction":
      return "🔧 機器不調";
    default:
      return type;
  }
}

function getMikotoMessage(
  playerName: string,
  heroName: string,
  level: number,
  cards: number,
  companions: number
): string {
  if (level <= 1 && cards === 0)
    return `${playerName}、今日もオルガモンワールドへようこそ！ まずは章マップから冒険を始めましょう✨`;
  if (cards >= 20)
    return `${playerName}、カードが${cards}枚も集まったわね！ 図鑑コンプが見えてきたかも…✨`;
  if (companions >= 3)
    return `${playerName}、頼もしい仲間が${companions}体もいるわ。チーム編成を工夫してボスに挑んでみて！`;
  if (level >= 5)
    return `Lv.${level}になった${heroName}… 順調に成長してるわね。もっと難しい章にも挑戦してみて！`;
  return `${playerName}、今日もオルガモンワールドへようこそ！ 章マップから冒険を進めよう✨`;
}
