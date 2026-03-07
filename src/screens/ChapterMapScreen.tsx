import { useGameStore } from "../stores/gameStore";
import { useState, useEffect, useMemo } from "react";
import { getBossByChapter } from "../logic/battleLogic";
import { getQuestionsByChapter } from "../logic/quizLogic";
import { ScreenLayout, GlassCard, PastelButton, ProgressBar, Badge, Modal } from "../components/common";
import { audio } from "../utils/audio";
import chapterMapBg from "../assets/chapter_map_bg.png";

// 事前学習キーワード解説データ
const KEYWORD_EXPLANATIONS: Record<string, { emoji: string; title: string; summary: string; keyPoint: string; funFact: string }> = {
  "細胞": {
    emoji: "🔬",
    title: "細胞（さいぼう）",
    summary: "生物の体をつくる最も小さな単位。人間の体は約37兆個の細胞でできている！",
    keyPoint: "細胞は生命の基本単位で、すべての生物は細胞からできています。",
    funFact: "🤯 ヒトの体の細胞をぜんぶ並べると、地球を4周以上できるほど長くなるよ！",
  },
  "基本単位": {
    emoji: "🧱",
    title: "基本単位（きほんたんい）",
    summary: "体の構造と機能のいちばん基礎になるもの。レンガが建物の素材なら、細胞は体の素材！",
    keyPoint: "人体の構造と機能の基本単位＝細胞。これが生命活動のすべての基盤。",
    funFact: "🏗️ 家を建てるにはレンガが必要。人体をつくるには…細胞が必要！",
  },
  "人体": {
    emoji: "🧍",
    title: "人体（じんたい）",
    summary: "私たちの体のこと。頭の先からつま先まで、たくさんの器官が協力して動いている。",
    keyPoint: "人体は細胞→組織→器官→器官系という階層構造でできています。",
    funFact: "💪 人体にある骨の数は成人で206本。赤ちゃんはなんと約300本もあるんだよ！",
  },
  "細胞膜": {
    emoji: "🛡️",
    title: "細胞膜（さいぼうまく）",
    summary: "細胞の外側を包む薄い膜。必要なものだけを通す門番の役割！",
    keyPoint: "細胞膜は選択的透過性をもち、細胞の中と外の物質の出入りを調節します。",
    funFact: "🚪 細胞膜は厚さわずか7〜8nm。髪の毛の1万分の1ぐらいの薄さ！",
  },
  "選択透過": {
    emoji: "🎯",
    title: "選択透過（せんたくとうか）",
    summary: "細胞膜が、通していいものとダメなものを選んで通す性質。VIPクラブの入口みたい！",
    keyPoint: "細胞膜は半透膜で、水や酸素は通すが大きな分子は簡単に通さない。",
    funFact: "🎪 細胞膜はリン脂質二重層でできていて、まるでサンドイッチみたいな構造！",
  },
  "核": {
    emoji: "🧠",
    title: "核（かく）",
    summary: "細胞の中にある司令塔。DNAという設計図が入っている、細胞のコントロールセンター！",
    keyPoint: "核の中にはDNA（遺伝情報）が収められており、細胞の活動を制御します。",
    funFact: "📜 1つの細胞の中のDNAを伸ばすと約2メートル。全細胞分だと太陽まで往復できる！",
  },
  "器官系": {
    emoji: "⚙️",
    title: "器官系（きかんけい）",
    summary: "似た仕事をする器官のグループ。消化器系・循環器系・呼吸器系などがある。",
    keyPoint: "器官系は複数の器官が協力して一つの大きな機能を果たすシステムです。",
    funFact: "🎼 オーケストラみたいに、各セクション（器官系）が協力して体を動かしてるよ！",
  },
  "遺伝": {
    emoji: "🧬",
    title: "遺伝（いでん）",
    summary: "親の特徴が子に伝わること。目の色や血液型が似るのは遺伝のおかげ！",
    keyPoint: "遺伝情報はDNAに保存され、細胞分裂の時にコピーされて次の世代に伝わります。",
    funFact: "🐼 パンダの白黒模様も遺伝。でも人間のDNAとパンダのDNAは約60%が同じ！",
  },
  "ホメオスタシス": {
    emoji: "⚖️",
    title: "ホメオスタシス",
    summary: "体の中の環境を一定に保つしくみ。暑い時に汗をかくのもホメオスタシス！",
    keyPoint: "体温・血糖値・pH値など、体内環境を安定させる自動調節機能のこと。",
    funFact: "🌡️ 人間の体温は約36.5℃。これがたった4℃上がるだけで命に関わるんだ！",
  },
  "ミトコンドリア": {
    emoji: "⚡",
    title: "ミトコンドリア",
    summary: "細胞のエネルギー工場！食べ物からATPというエネルギーを作り出す。",
    keyPoint: "ミトコンドリアは酸素を使って有機物を分解し、ATPを大量に生産します。",
    funFact: "🏭 ミトコンドリアは独自のDNAを持っている。昔は別の生物だったという説も！",
  },
  "リボソーム": {
    emoji: "🏭",
    title: "リボソーム",
    summary: "タンパク質を作る小さな工場。DNAの設計図通りにアミノ酸を組み立てる！",
    keyPoint: "リボソームはmRNAの情報を読み取り、アミノ酸をつなげてタンパク質を合成します。",
    funFact: "🔧 1つの細胞に数百万個のリボソームがある。製造ラインがすごい！",
  },
  "組織": {
    emoji: "🧩",
    title: "組織（そしき）",
    summary: "同じ形・同じ働きをする細胞が集まったグループ。筋組織・上皮組織などがある。",
    keyPoint: "組織は同種の細胞が集合したもので、特定の機能を持つ構造単位です。",
    funFact: "🎭 人体には4種類の組織（上皮・結合・筋・神経）がある。シンプル！",
  },
  "器官": {
    emoji: "🫀",
    title: "器官（きかん）",
    summary: "複数の組織が組み合わさってできた、特定の仕事をする部分。心臓・肺・胃など。",
    keyPoint: "器官は複数の組織が集まって特定の機能を果たす構造体です。",
    funFact: "❤️ 心臓は1日に約10万回も拍動！一生で約30億回もポンプしてくれる！",
  },
  "骨格": {
    emoji: "🦴",
    title: "骨格（こっかく）",
    summary: "体を支え、形を保ち、内臓を守る骨の集まり。体のフレーム！",
    keyPoint: "骨格は206個の骨からなり、支持・保護・運動・造血の機能を持ちます。",
    funFact: "💀 赤ちゃんは約300個の骨があるけど、成長するとくっついて206個になる！",
  },
  "筋": {
    emoji: "💪",
    title: "筋（きん）",
    summary: "体を動かすための組織。骨格筋・心筋・平滑筋の3種類がある！",
    keyPoint: "筋肉は収縮と弛緩によって運動を生み出す。随意筋と不随意筋がある。",
    funFact: "😊 笑顔を作るには12個の筋肉、しかめっ面には62個の筋肉が必要！",
  },
  "血液": {
    emoji: "🩸",
    title: "血液（けつえき）",
    summary: "体の中を流れる赤い液体。酸素や栄養を運び、病気と戦う！",
    keyPoint: "血液は赤血球・白血球・血小板・血漿からなり、運搬・防御・止血の機能を持つ。",
    funFact: "🌊 大人の体内には約5リットルの血液があり、1分で全身を1周する！",
  },
  "呼吸器系": {
    emoji: "🌬️",
    title: "呼吸器系（こきゅうきけい）",
    summary: "空気を吸って酸素を取り入れ、二酸化炭素を出すシステム。鼻・気管・肺など。",
    keyPoint: "呼吸器系は外呼吸（ガス交換）を行い、体中の細胞に酸素を届けます。",
    funFact: "🫁 肺の表面積をぜんぶ広げるとテニスコート1面分の広さになる！",
  },
  "拍動性": {
    emoji: "💓",
    title: "拍動性（はくどうせい）",
    summary: "心臓が規則正しくリズミカルに収縮する性質。自分の意志で止められない！",
    keyPoint: "心筋は自動的にリズムを作る特殊な筋肉で、洞結節がペースメーカー役。",
    funFact: "🎵 安静時の心拍数は1分間に約60〜80回。運動すると200回近くまで上がる！",
  },
  "ホメオスタシス（体液）": {
    emoji: "💧",
    title: "ホメオスタシス（体液）",
    summary: "体液の量や成分を一定に保つしくみ。腎臓が大活躍！",
    keyPoint: "腎臓は血液をろ過して老廃物を排出し、体液のバランスを維持します。",
    funFact: "🧪 腎臓は1日に約180リットルの血液をろ過している！すごい処理能力！",
  },
};

// デフォルトの解説を生成
function getKeywordExplanation(keyword: string) {
  if (KEYWORD_EXPLANATIONS[keyword]) {
    return KEYWORD_EXPLANATIONS[keyword];
  }
  return {
    emoji: "📚",
    title: keyword,
    summary: `「${keyword}」は看護・医療の重要なキーワードです。クイズに挑戦して理解を深めよう！`,
    keyPoint: `${keyword}について、章のクイズで詳しく学べます。`,
    funFact: "🎮 クイズに正解するとマスタリーが上がるよ！くり返し学習が大切！",
  };
}

const chapters = [
  { id: 1, name: "細胞の国", subtitle: "生命の始まりを守れ", emoji: "🧬", color: "#f08080" },
  { id: 2, name: "器官の国", subtitle: "バランスの守護者", emoji: "🫀", color: "#b8a9c9" },
  { id: 3, name: "骨格の国", subtitle: "崩れゆく大地", emoji: "🦴", color: "#98d4bb" },
  { id: 4, name: "体液の国", subtitle: "赤き流れの危機", emoji: "🩸", color: "#f06060" },
  { id: 5, name: "内臓の国", subtitle: "消化の迷宮", emoji: "🫁", color: "#e8a040" },
  { id: 6, name: "循環の国", subtitle: "止まらぬ鼓動", emoji: "❤️", color: "#e06080" },
  { id: 7, name: "呼吸の国", subtitle: "最後の一息", emoji: "🌬️", color: "#87ceeb" },
  { id: 8, name: "感覚の国", subtitle: "五感の試練", emoji: "🧠", color: "#d8b4fe" },
  { id: 9, name: "最終決戦", subtitle: "パンデミックの影", emoji: "👑", color: "#ffd700" },
];

type QuizMode = "mini" | "confirm";
const CHAPTERS_PER_PAGE = 2;

export default function ChapterMapScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const currentRun = useGameStore((s) => s.currentRun);
  useEffect(() => { audio.playBGM("map"); }, []);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [chapterPage, setChapterPage] = useState(0);
  const [keywordModal, setKeywordModal] = useState<{ keyword: string; chapterColor: string } | null>(null);

  // 各章のキーワードを集約（事前学習用）
  const chapterKeywords = useMemo(() => {
    const map: Record<number, string[]> = {};
    for (const ch of chapters) {
      const qs = getQuestionsByChapter(ch.id);
      const kwSet = new Set<string>();
      for (const q of qs) {
        for (const kw of q.keywords ?? []) {
          kwSet.add(kw);
        }
      }
      map[ch.id] = [...kwSet].slice(0, 6);
    }
    return map;
  }, []);

  if (!currentRun) return null;

  const totalPages = Math.max(1, Math.ceil(chapters.length / CHAPTERS_PER_PAGE));
  const clampedPage = Math.min(chapterPage, totalPages - 1);
  const pageStart = clampedPage * CHAPTERS_PER_PAGE;
  const visibleChapters = chapters.slice(pageStart, pageStart + CHAPTERS_PER_PAGE);
  const selectedChapter = selectedChapterId
    ? chapters.find((chapter) => chapter.id === selectedChapterId) ?? null
    : null;

  const handleStartQuiz = (chapter: number, mode: QuizMode) => {
    useGameStore.setState((s) => ({
      ...s,
      _quizChapter: chapter,
      _quizMode: mode,
    } as unknown as typeof s));
    setScreen("quiz");
  };

  const handleStartBattle = (chapter: number) => {
    useGameStore.setState((s) => ({
      ...s,
      _battleChapter: chapter,
      _storyChapter: chapter,
      _storyTiming: "pre_boss",
    } as unknown as typeof s));
    setScreen("story");
  };

  return (
    <ScreenLayout
      onBack={() => setScreen("home")}
      title="章マップ"
      titleEmoji="🗺️"
      padding="compact"
      className="h-[100dvh] flex flex-col pb-[calc(env(safe-area-inset-bottom)+0.25rem)] relative"
    >
      {/* Map background */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none z-0"
        style={{
          backgroundImage: `url(${chapterMapBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(1px)",
        }}
      />
      <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
        <GlassCard className="p-2.5 shrink-0">
          <div className="flex items-center gap-2">
            {currentRun.team.length > 0 && (
              <div className="flex-1 flex items-center gap-1.5 overflow-x-auto">
                {currentRun.team.map((c) => (
                  <Badge key={c.id} variant="default" size="xs" icon="👤">
                    {c.name} Lv.{c.level}
                  </Badge>
                ))}
              </div>
            )}
            <PastelButton
              variant="secondary"
              size="sm"
              icon="👥"
              onClick={() => setScreen("team_edit")}
              className="shrink-0"
            >
              編成
            </PastelButton>
          </div>
        </GlassCard>

        <div className="flex-1 min-h-0 grid grid-rows-2 gap-2">
          {visibleChapters.map((ch, idx) => {
            const progress = currentRun.chapterProgress[ch.id];
            const isUnlocked = progress?.unlocked ?? false;
            const mastery = progress?.mastery ?? 0;
            const bossDefeated = progress?.bossDefeated ?? false;
            const canChallenge = isUnlocked && !bossDefeated;

            return (
              <GlassCard
                key={ch.id}
                variant={isUnlocked ? "strong" : "subtle"}
                className={`p-3 h-full flex flex-col animate-slide-up ${!isUnlocked ? "opacity-40" : ""}`}
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-sm"
                    style={{ backgroundColor: ch.color + "20" }}
                  >
                    {isUnlocked ? ch.emoji : "🔒"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-[10px] text-warm-gray/40 font-medium">Ch.{ch.id}</span>
                      {bossDefeated && (
                        <Badge variant="success" size="xs">✅ クリア</Badge>
                      )}
                    </div>
                    <p className="font-bold text-warm-gray text-[14px] truncate">{ch.name}</p>
                    <p className="text-[11px] text-warm-gray/50 truncate">{ch.subtitle}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-warm-gray/40">マスタリー</p>
                    <p className="font-bold text-base leading-none" style={{ color: ch.color }}>{mastery}%</p>
                  </div>
                </div>
                <ProgressBar
                  value={mastery}
                  max={100}
                  color={ch.color}
                  size="xs"
                  className="mt-2"
                />
                {/* キーワードタグ（事前学習・タップで解説） */}
                {chapterKeywords[ch.id]?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {chapterKeywords[ch.id].map((kw) => (
                      <button
                        key={kw}
                        onClick={() => setKeywordModal({ keyword: kw, chapterColor: ch.color })}
                        className="text-[11px] px-2.5 py-1 rounded-full font-bold transition-all active:scale-95 hover:brightness-90 shadow-sm"
                        style={{ backgroundColor: ch.color + "22", color: ch.color, border: `1px solid ${ch.color}40` }}
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-auto pt-2">
                  <div className="text-[10px] text-warm-gray/45 mb-1.5">
                    {bossDefeated ? "ボス撃破済み" : canChallenge ? "挑戦可能" : "未開放"}
                  </div>
                  <button
                    onClick={() => isUnlocked && setSelectedChapterId(ch.id)}
                    disabled={!isUnlocked}
                    className={`w-full py-3 text-sm rounded-xl font-bold transition-all ${isUnlocked
                      ? "bg-indigo-500 text-white shadow-md btn-press"
                      : "bg-gray-100 text-warm-gray/30"
                      }`}
                  >
                    {canChallenge ? "⚔ 挑戦メニュー" : "📖 章メニュー"}
                  </button>
                </div>
              </GlassCard>
            );
          })}
          {visibleChapters.length < CHAPTERS_PER_PAGE &&
            Array.from({ length: CHAPTERS_PER_PAGE - visibleChapters.length }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="rounded-2xl border-2 border-dashed border-white/50 bg-white/20 grid place-items-center text-[11px] text-warm-gray/30"
              >
                章データなし
              </div>
            ))}
        </div>

        <GlassCard className="p-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setChapterPage((prev) => Math.max(0, Math.min(prev, totalPages - 1) - 1))}
              disabled={clampedPage === 0}
              className={`flex-1 min-h-10 rounded-lg text-sm font-bold ${clampedPage === 0
                ? "bg-gray-100 text-warm-gray/30"
                : "bg-indigo-100/70 text-indigo-700 btn-press"
                }`}
            >
              ← 前へ
            </button>
            <p className="text-[11px] text-warm-gray/50 shrink-0 min-w-16 text-center">
              {clampedPage + 1}/{totalPages}
            </p>
            <button
              onClick={() =>
                setChapterPage((prev) =>
                  Math.min(totalPages - 1, Math.min(prev, totalPages - 1) + 1)
                )
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
        </GlassCard>
      </div>

      <Modal
        open={!!selectedChapter}
        onClose={() => setSelectedChapterId(null)}
        position="bottom"
        showHandle
      >
        {selectedChapter && (
          <div>
            {(() => {
              const progress = currentRun.chapterProgress[selectedChapter.id];
              const isUnlocked = progress?.unlocked ?? false;
              const mastery = progress?.mastery ?? 0;
              const bossDefeated = progress?.bossDefeated ?? false;
              const boss = getBossByChapter(selectedChapter.id);
              const canBossBattle =
                isUnlocked &&
                !bossDefeated &&
                ((progress?.miniQuizBest ?? 0) >= 50 || (progress?.confirmQuizBest ?? 0) >= 50);
              return (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: selectedChapter.color + "20" }}
                    >
                      {isUnlocked ? selectedChapter.emoji : "🔒"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-warm-gray/40">Ch.{selectedChapter.id}</p>
                      <p className="text-base font-bold text-warm-gray truncate">{selectedChapter.name}</p>
                      <p className="text-[11px] text-warm-gray/50 truncate">{selectedChapter.subtitle}</p>
                    </div>
                  </div>

                  <GlassCard className="p-3 mb-3 !bg-white/55">
                    <p className="text-[11px] text-warm-gray/50 mb-1">進行状況</p>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-warm-gray">マスタリー {mastery}%</span>
                      {bossDefeated && <Badge variant="success" size="xs">ボス撃破済み</Badge>}
                    </div>
                    <ProgressBar
                      value={mastery}
                      max={100}
                      color={selectedChapter.color}
                      size="xs"
                    />
                    <div className="flex gap-3 text-[10px] text-warm-gray/40 mt-2">
                      <span>📝 小テスト最高: {progress?.miniQuizBest ?? 0}%</span>
                      <span>📋 確認テスト最高: {progress?.confirmQuizBest ?? 0}%</span>
                    </div>
                  </GlassCard>

                  <div className="grid grid-cols-2 gap-2">
                    <PastelButton
                      variant="secondary"
                      size="sm"
                      icon="📝"
                      onClick={() => {
                        setSelectedChapterId(null);
                        handleStartQuiz(selectedChapter.id, "mini");
                      }}
                      disabled={!isUnlocked}
                    >
                      小テスト
                    </PastelButton>
                    <PastelButton
                      gradient="coral"
                      size="sm"
                      icon="📋"
                      onClick={() => {
                        setSelectedChapterId(null);
                        handleStartQuiz(selectedChapter.id, "confirm");
                      }}
                      disabled={!isUnlocked}
                    >
                      確認テスト
                    </PastelButton>
                  </div>

                  {boss && (
                    <PastelButton
                      fullWidth
                      size="sm"
                      className="mt-2"
                      variant={bossDefeated ? "success" : canBossBattle ? "primary" : "secondary"}
                      gradient="coral"
                      icon={bossDefeated ? "✅" : canBossBattle ? "⚔️" : "🔒"}
                      disabled={!canBossBattle || bossDefeated}
                      onClick={() => {
                        if (!canBossBattle) return;
                        setSelectedChapterId(null);
                        handleStartBattle(selectedChapter.id);
                      }}
                    >
                      {bossDefeated
                        ? `${boss.name} 撃破済み`
                        : canBossBattle
                          ? `ボス戦: ${boss.name}`
                          : "テストで50%以上で解放"}
                    </PastelButton>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </Modal>

      {/* キーワード解説モーダル */}
      <Modal
        open={!!keywordModal}
        onClose={() => setKeywordModal(null)}
        position="bottom"
        showHandle
      >
        {keywordModal && (() => {
          const info = getKeywordExplanation(keywordModal.keyword);
          return (
            <div className="pb-2">
              {/* ヘッダー */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl animate-float shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${keywordModal.chapterColor}30, ${keywordModal.chapterColor}15)` }}
                >
                  {info.emoji}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: keywordModal.chapterColor }}>事前学習</p>
                  <h3 className="text-base font-extrabold text-warm-gray">{info.title}</h3>
                </div>
              </div>

              {/* メイン解説 */}
              <div
                className="rounded-2xl p-4 mb-3 border"
                style={{ backgroundColor: keywordModal.chapterColor + "08", borderColor: keywordModal.chapterColor + "20" }}
              >
                <p className="text-sm text-warm-gray leading-relaxed font-medium">{info.summary}</p>
              </div>

              {/* ポイントカード */}
              <div className="rounded-2xl p-3.5 mb-3 bg-gradient-to-r from-amber-50/80 to-yellow-50/60 border border-amber-100/60">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">📌</span>
                  <p className="text-[11px] font-bold text-amber-700 tracking-wider">おさえるポイント</p>
                </div>
                <p className="text-[12px] text-warm-gray/80 leading-relaxed">{info.keyPoint}</p>
              </div>

              {/* おもしろ豆知識 */}
              <div className="rounded-2xl p-3.5 mb-4 bg-gradient-to-r from-purple-50/60 to-pink-50/60 border border-purple-100/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm animate-pulse">✨</span>
                  <p className="text-[11px] font-bold text-purple-600 tracking-wider">おもしろ豆知識</p>
                </div>
                <p className="text-[12px] text-warm-gray/80 leading-relaxed">{info.funFact}</p>
              </div>

              {/* 閉じるボタン */}
              <button
                onClick={() => setKeywordModal(null)}
                className="w-full py-3 rounded-xl font-bold text-sm text-white shadow-md btn-press"
                style={{ background: `linear-gradient(135deg, ${keywordModal.chapterColor}, ${keywordModal.chapterColor}cc)` }}
              >
                わかった！ 💪
              </button>
            </div>
          );
        })()}
      </Modal>
    </ScreenLayout>
  );
}
