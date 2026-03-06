import { useState } from "react";
import { Modal, PastelButton, GlassCard, ProgressBar } from "./common";

type TutorialSlide = {
  title: string;
  emoji: string;
  color: string;
  image?: string;
  content: { heading?: string; text: string }[];
};

const TUTORIAL_SLIDES: TutorialSlide[] = [
  {
    title: "ゲームの目的",
    emoji: "🎯",
    color: "#f08080",
    image: "/images/tutorial/tutorial_goal.webp",
    content: [
      {
        text: "「オルガモン図鑑クエスト」は、人体の仕組みをクイズとバトルで楽しく学ぶ冒険RPGです。",
      },
      {
        heading: "🌍 9つの国を冒険",
        text: "細胞・器官・骨格・体液・内臓・循環・呼吸・感覚の国を巡り、最終決戦に挑みます。",
      },
      {
        heading: "📚 図鑑コンプを目指そう",
        text: "クイズに正解してカードを集め、仲間を増やし、図鑑100%を達成しましょう！",
      },
    ],
  },
  {
    title: "ホーム画面の見方",
    emoji: "🏠",
    color: "#b8a9c9",
    image: "/images/tutorial/tutorial_home.webp",
    content: [
      {
        heading: "📊 3つのステータス",
        text: "XP（経験値）、MP（ショップ用通貨）、欠片（素材）が上部に表示されます。",
      },
      {
        heading: "📋 3つのタブ",
        text: "「概要」でXP・カード数を確認、「サポート」でヒントを閲覧、「デイリー」で日替わりミッションに挑戦できます。",
      },
      {
        heading: "🔘 下部メニュー",
        text: "章マップ・チーム編成・図鑑・ショップ・プロフィールにアクセスできます。",
      },
    ],
  },
  {
    title: "章マップの進め方",
    emoji: "🗺️",
    color: "#98d4bb",
    image: "/images/tutorial/tutorial_map.webp",
    content: [
      {
        heading: "📝 小テスト",
        text: "気軽に挑戦できるウォームアップクイズ。何度でも繰り返して知識を定着させましょう。",
      },
      {
        heading: "📋 確認テスト",
        text: "より多くの問題が出題されます。報酬も大きく、ボス戦の準備に最適です。",
      },
      {
        heading: "⚔️ ボス戦の解放条件",
        text: "小テストか確認テストで50%以上のスコアを取ると、その章のボス戦に挑戦できます。",
      },
    ],
  },
  {
    title: "クイズの遊び方",
    emoji: "📝",
    color: "#f0c040",
    image: "/images/tutorial/tutorial_quiz.webp",
    content: [
      {
        heading: "🔢 選択肢をタップ",
        text: "問題を読んで、正しいと思う選択肢をタップしましょう。制限時間内に答えてください。",
      },
      {
        heading: "🌸🔥 難易度で変化",
        text: "やさしい問題は選択肢が少なめ、むずかしい問題は選択肢の並びがランダムになります。",
      },
      {
        heading: "💡 解説を読もう",
        text: "正解でも不正解でも解説が表示されます。次に同じ問題が出たときに活かしましょう！",
      },
    ],
  },
  {
    title: "ボス戦の遊び方",
    emoji: "⚔️",
    color: "#e06080",
    image: "/images/tutorial/tutorial_battle.webp",
    content: [
      {
        heading: "🎯 クイズで攻撃",
        text: "正解するとボスにダメージ！不正解だとボスから反撃を受け、ホメオスタシスが減少します。",
      },
      {
        heading: "💓 ホメオスタシス",
        text: "体の安定度を表すゲージです。0になるとゲームオーバー。回復アイテムで管理しましょう。",
      },
      {
        heading: "⚡ スキル & 🎒 アイテム",
        text: "画面下のボタンからスキルやアイテムを使えます。ヒント表示・選択肢削減・回復など戦略が広がります。",
      },
    ],
  },
  {
    title: "デバフに注意",
    emoji: "⚠️",
    color: "#ff8c42",
    image: "/images/tutorial/tutorial_debuff.webp",
    content: [
      {
        heading: "❌ 誤情報",
        text: "選択肢のひとつに黄色い枠が付きますが、これはミスリードです。正解とは限りません！",
      },
      {
        heading: "👁️ 観察ミス",
        text: "問題文がぼやけて見えにくくなります。ゆっくり読めば内容は確認できます。",
      },
      {
        heading: "⏰ 時間圧迫 / 🔧 機器故障",
        text: "時間圧迫は制限時間が減少、機器故障はスキルが使えなくなります。アイテムで解除可能です。",
      },
    ],
  },
  {
    title: "仲間とチーム",
    emoji: "👥",
    color: "#87ceeb",
    image: "/images/tutorial/tutorial_team.webp",
    content: [
      {
        heading: "🦸 ヒーロー＋仲間2体",
        text: "選んだヒーローと仲間2体でチームを組みます。仲間はクイズ報酬で出会えます。",
      },
      {
        heading: "🔄 フォーメーション",
        text: "バトルでは1番手から順に攻撃します。各メンバーのATK・DEF・SPDが重要です。",
      },
      {
        heading: "💥 コンボ",
        text: "特定の仲間の組み合わせでコンボが発動！攻撃力アップなどの特殊効果を得られます。",
      },
    ],
  },
  {
    title: "図鑑とコレクション",
    emoji: "📚",
    color: "#d8b4fe",
    image: "/images/tutorial/tutorial_zukan.webp",
    content: [
      {
        heading: "🃏 カード",
        text: "クイズの正解報酬でカードを獲得。全カードを集めると特別なパスワードが手に入ります。",
      },
      {
        heading: "🛍️ ショップ",
        text: "MPを使ってスキルやアイテムを購入できます。ボス戦前に準備しておきましょう。",
      },
      {
        heading: "🏅 実績と称号",
        text: "特定の条件を達成すると実績が解放され、称号を獲得。プロフィールで設定できます。",
      },
    ],
  },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function TutorialModal({ open, onClose }: Props) {
  const [page, setPage] = useState(0);
  const slide = TUTORIAL_SLIDES[page];
  const isFirst = page === 0;
  const isLast = page === TUTORIAL_SLIDES.length - 1;

  const handleClose = () => {
    setPage(0);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} position="center" className="!max-h-[92dvh]">
      {slide && (
        <div className="flex flex-col max-h-[82dvh]">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 shrink-0">
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm"
                style={{ backgroundColor: slide.color + "20" }}
              >
                {slide.emoji}
              </div>
              <div>
                <p className="text-[10px] text-warm-gray/40">
                  {page + 1}/{TUTORIAL_SLIDES.length}
                </p>
                <p className="font-bold text-sm text-warm-gray">{slide.title}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center text-warm-gray/50 text-sm hover:bg-white/80 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Progress */}
          <ProgressBar
            value={page + 1}
            max={TUTORIAL_SLIDES.length}
            color={slide.color}
            size="xs"
            className="mb-3 shrink-0"
          />

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            {/* Illustration */}
            {slide.image && (
              <div
                className="w-full h-36 rounded-xl mb-3 flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: slide.color + "12" }}
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Hide image if not found, show large emoji instead
                    (e.target as HTMLImageElement).style.display = "none";
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      parent.innerHTML = `<span class="text-6xl opacity-60">${slide.emoji}</span>`;
                    }
                  }}
                />
              </div>
            )}

            {/* Text content */}
            <div className="space-y-2.5">
              {slide.content.map((item, idx) => (
                <GlassCard
                  key={idx}
                  variant="subtle"
                  className="p-3 !bg-white/50"
                >
                  {item.heading && (
                    <p className="font-bold text-xs text-warm-gray mb-1">
                      {item.heading}
                    </p>
                  )}
                  <p className="text-xs text-warm-gray/70 leading-relaxed">
                    {item.text}
                  </p>
                </GlassCard>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-2 pt-3 shrink-0">
            <PastelButton
              variant="secondary"
              size="sm"
              className="flex-1"
              disabled={isFirst}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              icon="←"
            >
              前へ
            </PastelButton>
            {isLast ? (
              <PastelButton
                gradient="coral"
                size="sm"
                className="flex-1"
                onClick={handleClose}
                icon="✨"
              >
                はじめよう！
              </PastelButton>
            ) : (
              <PastelButton
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={() => setPage((p) => Math.min(TUTORIAL_SLIDES.length - 1, p + 1))}
                icon="→"
              >
                次へ
              </PastelButton>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
