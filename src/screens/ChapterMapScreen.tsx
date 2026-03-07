import { useGameStore } from "../stores/gameStore";
import { useState, useEffect, useMemo } from "react";
import { getBossByChapter } from "../logic/battleLogic";
import { getQuestionsByChapter } from "../logic/quizLogic";
import { ScreenLayout, GlassCard, PastelButton, ProgressBar, Badge, Modal } from "../components/common";
import { audio } from "../utils/audio";
import chapterMapBg from "../assets/chapter_map_bg.png";

// 事前学習キーワード解説データ
const KEYWORD_EXPLANATIONS: Record<string, { emoji: string; title: string; summary: string; keyPoint: string; funFact: string }> = {
  // ===== Ch.1 細胞の国 =====
  "細胞": {
    emoji: "🔬",
    title: "細胞（さいぼう）",
    summary: "生物の体をつくる最も小さな単位。人間の体は約37兆個の細胞でできている！",
    keyPoint: "細胞は生命の基本単位で、すべての生物は細胞からできています。細胞は細胞膜で包まれ、内部に核や各種小器官を持っています。",
    funFact: "🤯 ヒトの体の細胞をぜんぶ並べると、地球を4周以上できるほど長くなるよ！",
  },
  "基本単位": {
    emoji: "🧱",
    title: "基本単位（きほんたんい）",
    summary: "体の構造と機能のいちばん基礎になるもの。レンガが建物の素材なら、細胞は体の素材！",
    keyPoint: "人体の構造と機能の基本単位＝細胞。細胞膜で外部から隔絶され、栄養を選択的に取り入れ、不要物を排出する仕組みを持っています。",
    funFact: "🏗️ 家を建てるにはレンガが必要。人体をつくるには…細胞が必要！",
  },
  "人体": {
    emoji: "🧍",
    title: "人体（じんたい）",
    summary: "私たちの体のこと。頭の先からつま先まで、たくさんの器官が協力して動いている。",
    keyPoint: "人体は細胞→組織→器官→器官系という階層構造でできています。すべての器官系が連携してホメオスタシスを維持しています。",
    funFact: "💪 人体にある骨の数は成人で206本。赤ちゃんはなんと約300本もあるんだよ！",
  },
  "細胞膜": {
    emoji: "🛡️",
    title: "細胞膜（さいぼうまく）",
    summary: "細胞の外側を包む薄い膜。必要なものだけを通す門番の役割！",
    keyPoint: "細胞膜にはレセプター（受容体）があり、ホルモンや薬物に反応します。インスリンと結合してブドウ糖を通すのもこの仕組み。",
    funFact: "🚪 細胞膜は厚さわずか7〜8nm。髪の毛の1万分の1ぐらいの薄さ！",
  },
  "選択透過": {
    emoji: "🎯",
    title: "選択透過（せんたくとうか）",
    summary: "細胞膜が、通していいものとダメなものを選んで通す性質。VIPクラブの入口みたい！",
    keyPoint: "細胞膜は半透膜で、外部から栄養を選択的に取り入れ、内部でできた物質を分泌・排出します。血糖調節もこの仕組みが基本。",
    funFact: "🎪 細胞膜はリン脂質二重層でできていて、まるでサンドイッチみたいな構造！",
  },
  "核": {
    emoji: "🧠",
    title: "核（かく）",
    summary: "細胞の中にある司令塔。DNAという設計図が入っている、細胞のコントロールセンター！",
    keyPoint: "核の中には22対の常染色体と1対の性染色体（計23対）が存在。核膜孔を通じて細胞質と物質のやり取りをしています。",
    funFact: "📜 1つの細胞の中のDNAを伸ばすと約2メートル。全細胞分だと太陽まで往復できる！",
  },

  // ===== Ch.2 器官の国 =====
  "器官系": {
    emoji: "⚙️",
    title: "器官系（きかんけい）",
    summary: "似た仕事をする器官のグループ。消化器系・心臓血管系・呼吸器系などがある。",
    keyPoint: "各器官系は独立して機能するのではなく、互いに情報伝達・協力して体のバランス（ホメオスタシス）を保っています。",
    funFact: "🎼 大量に食事をとると消化器系が心臓血管系にSOSを出して血液の量を増やしてもらうんだよ！",
  },
  "連携": {
    emoji: "🤝",
    title: "連携（れんけい）",
    summary: "器官と器官系が互いに情報を交換し合って、体全体がうまく働くようにすること。",
    keyPoint: "心臓は体が休むとペースを落とし、他の器官が血液を必要とするとペースを上げます。腎臓は水分量に応じて尿の量を調節します。",
    funFact: "📡 器官同士の情報伝達は、神経信号とホルモンという2つの方法で行われているよ！",
  },
  "ホメオスタシス": {
    emoji: "⚖️",
    title: "ホメオスタシス",
    summary: "体の中の環境を一定に保つしくみ。暑い時に汗をかくのもホメオスタシス！",
    keyPoint: "器官と器官系がうまく連動することで体のバランスが保たれます。この概念（恒常性）は自律神経系が大部分をコントロールしています。",
    funFact: "🌡️ 人間の体温は約36.5℃。これがたった4℃上がるだけで命に関わるんだ！",
  },
  "恒常性": {
    emoji: "🔄",
    title: "恒常性（こうじょうせい）",
    summary: "ホメオスタシスの日本語名。体温や血糖値を一定に保つ、体の自動調節システム！",
    keyPoint: "体温調節・血液の浸透圧調節・水分調節・ホルモン調節がすべて恒常性に含まれます。姿勢調節は含まれません。",
    funFact: "🎯 恒常性を乱す原因はたくさんあるけど、体は24時間365日、自動で修正し続けているよ！",
  },
  "呼吸器系": {
    emoji: "🌬️",
    title: "呼吸器系（こきゅうきけい）",
    summary: "空気を吸って酸素を取り入れ、二酸化炭素を出すシステム。鼻・咽頭・気管・肺など。",
    keyPoint: "呼吸器系に含まれるのは鼻・咽頭・喉頭・気管・肺など。神経は呼吸器系には含まれません。",
    funFact: "🫁 肺の表面積をぜんぶ広げるとテニスコート1面分の広さになる！",
  },
  "肺": {
    emoji: "🫁",
    title: "肺（はい）",
    summary: "酸素と二酸化炭素を交換する呼吸の要。左右に1つずつ、胸腔の中にある。",
    keyPoint: "右肺は上葉・中葉・下葉の3つに分かれ、左肺は上葉・下葉の2つ。肺胞という小さな袋でガス交換が行われます。",
    funFact: "🎈 肺胞の数は約3億個！全部広げるとテニスコート1面分もの面積になるよ！",
  },

  // ===== Ch.3 骨格の国 =====
  "骨格": {
    emoji: "🦴",
    title: "骨格（こっかく）",
    summary: "体を支え、形を保ち、内臓を守る骨の集まり。体のフレーム！",
    keyPoint: "骨格は支持・保護・運動の機能に加えて、骨髄での造血やカルシウムの貯蔵も担っています。",
    funFact: "💀 赤ちゃんは約300個の骨があるけど、成長すると骨がくっついて206個になる！",
  },
  "骨膜": {
    emoji: "🎀",
    title: "骨膜（こつまく）",
    summary: "骨を包んでいる膜。血管・リンパ管・神経が豊富で、骨を保護している。",
    keyPoint: "骨膜は骨を保護し、骨芽細胞によって新しい骨質を作って骨を太くします。骨を打つと痛いのは、骨膜の知覚神経が刺激されるから。",
    funFact: "🤕 骨を打撲すると超痛いのは、骨膜にたくさんの知覚神経が通っているからなんだ！",
  },
  "骨質": {
    emoji: "🏗️",
    title: "骨質（こつしつ）",
    summary: "骨の硬い部分。表面の緻密質と内部の海綿質でできている。",
    keyPoint: "骨質は外側の硬い緻密質と、内部の海綿状の海綿質から構成されています。ハバース管が縦に走り、栄養を運んでいます。",
    funFact: "🔬 骨を顕微鏡で見ると同心円状の美しい模様が見える。これがハバース管の断面だよ！",
  },
  "骨": {
    emoji: "🦴",
    title: "骨（ほね）",
    summary: "体を支える硬い組織。骨膜・骨質・骨髄・骨端軟骨でできている。",
    keyPoint: "骨はカルシウムを蓄え、血中カルシウム濃度が低くなると骨からカルシウムが放出されます。脳や内臓を保護する役割も。",
    funFact: "🦷 骨は硬いけど生きている組織！常に古い骨が壊されて新しい骨が作られているよ！",
  },
  "関節": {
    emoji: "🔗",
    title: "関節（かんせつ）",
    summary: "骨と骨をつなぐ部位。関節があるから体を曲げたり動かしたりできる！",
    keyPoint: "関節をまたぐ形で骨格筋が骨に付着し、筋肉の収縮で関節が動いて運動が可能になります。頭蓋骨の縫合のように動かない連結もある。",
    funFact: "🤸 人体には約260個の関節がある！指だけでも27個の骨が関節でつながっているよ！",
  },
  "骨髄": {
    emoji: "🩸",
    title: "骨髄（こつずい）",
    summary: "骨の中心にある組織で、血球を作っている造血の工場！",
    keyPoint: "赤色骨髄は造血機能を持ち、血球（赤血球・白血球・血小板）を作ります。加齢で脂肪化して黄色骨髄になると造血機能は失われます。",
    funFact: "🏭 骨髄では毎日約2000億個もの赤血球が新しく作られているんだよ！すごい生産力！",
  },

  // ===== Ch.4 体液の国 =====
  "赤血球": {
    emoji: "🔴",
    title: "赤血球（せっけっきゅう）",
    summary: "血液中で最も多い血球。酸素を全身に運ぶ配達係！",
    keyPoint: "赤血球はヘモグロビンという鉄を含むタンパク質を持ち、酸素や二酸化炭素と結合して運搬します。血液の細胞成分で最も多い。",
    funFact: "🔴 赤血球は核を持たない珍しい細胞！そのおかげで酸素をたくさん積めるんだ！",
  },
  "血球": {
    emoji: "⭕",
    title: "血球（けっきゅう）",
    summary: "血液中の細胞成分の総称。赤血球・白血球・血小板の3種類がある。",
    keyPoint: "血球は骨髄で作られます。赤血球は酸素運搬、白血球は免疫、血小板は血液凝固と、それぞれ重要な役割を果たします。",
    funFact: "🔬 血液の約45%が血球（細胞成分）、残り55%は血漿（液体成分）でできているよ！",
  },
  "酸素": {
    emoji: "💨",
    title: "酸素（さんそ）",
    summary: "細胞が生きるために必要不可欠な気体。呼吸で取り入れ、血液で全身に運ばれる。",
    keyPoint: "酸素は赤血球のヘモグロビンと結合して運搬されます。酸素を多く含む血液が動脈血、二酸化炭素が多い血液が静脈血です。",
    funFact: "🌍 地球の大気の約21%が酸素。もしこの割合が少し変わるだけで生物は生きられない！",
  },
  "ヘモグロビン": {
    emoji: "🧲",
    title: "ヘモグロビン",
    summary: "赤血球の中にある赤い色素タンパク質。鉄を含み、酸素とくっつく力がすごい！",
    keyPoint: "ヘモグロビンは鉄を含むタンパク質で、酸素と結合して全身に運びます。酸素と結びつくと鮮やかな赤色になります。",
    funFact: "🧲 ヘモグロビン1分子は酸素を4つまで運べる！赤血球1個に約2.8億個のヘモグロビンがある！",
  },
  "白血球": {
    emoji: "⚪",
    title: "白血球（はっけっきゅう）",
    summary: "体を守る免疫の戦士たち！細菌やウイルスをやっつける。",
    keyPoint: "白血球は免疫系をつかさどり、体内に侵入した病原菌などの異物と戦います。マクロファージ、リンパ球（T細胞・B細胞）などの種類があります。",
    funFact: "⚔️ 白血球は血管の壁をすり抜けて移動できる！まるで忍者みたい！",
  },
  "免疫": {
    emoji: "🛡️",
    title: "免疫（めんえき）",
    summary: "体を病原体から守るシステム。体液性免疫と細胞性免疫の2種類がある！",
    keyPoint: "体液性免疫は抗体（B細胞→形質細胞が産生）が、細胞性免疫はキラーT細胞が直接抗原と反応します。反応が強すぎるとアレルギーに。",
    funFact: "🎯 抗体はY字型の構造をしていて、先端部分が特定の敵だけを認識する特異的反応をするよ！",
  },

  // ===== Ch.5 内臓の国 =====
  "脂肪": {
    emoji: "🧈",
    title: "脂肪（しぼう）",
    summary: "三大栄養素のひとつ。エネルギーの貯蔵庫で、体温を保つ役割も。",
    keyPoint: "脂肪は膵液に含まれるリパーゼによって分解されます。胆汁は脂肪を乳化して消化しやすくする役割があります。",
    funFact: "🧈 脂肪1gで9kcalのエネルギー！炭水化物やタンパク質の2倍以上もあるよ！",
  },
  "エネルギー": {
    emoji: "⚡",
    title: "エネルギー",
    summary: "生命活動を維持するための力。食べ物からATPという形で取り出される。",
    keyPoint: "三大栄養素（炭水化物・タンパク質・脂肪）を消化・吸収し、細胞内のミトコンドリアでATPに変換して利用します。",
    funFact: "⚡ 人間の体は1日に約70kgものATPを合成して使い切っている！体重とほぼ同じ量！",
  },
  "酵素": {
    emoji: "✂️",
    title: "酵素（こうそ）",
    summary: "化学反応を速くするタンパク質。消化酵素は食べ物を分解するハサミの役割！",
    keyPoint: "主な消化酵素はアミラーゼ（糖分解）、ペプシン・トリプシン（タンパク質分解）、リパーゼ（脂肪分解）。それぞれ特定の栄養素だけを分解。",
    funFact: "🔬 酵素は相手を選ぶ！アミラーゼはデンプンだけ、リパーゼは脂肪だけしか分解しないよ！",
  },
  "タンパク質": {
    emoji: "🥩",
    title: "タンパク質",
    summary: "三大栄養素のひとつ。筋肉・臓器・ホルモン・酵素など体のあらゆるものを作る材料！",
    keyPoint: "タンパク質はペプシン（胃）やトリプシン（膵臓）で分解されます。アミノ酸に分解され小腸で吸収されます。",
    funFact: "🧬 人体のタンパク質は約10万種類もある！全部20種類のアミノ酸の組み合わせでできてるよ！",
  },
  "蠕動運動": {
    emoji: "🐛",
    title: "蠕動運動（ぜんどううんどう）",
    summary: "消化管が波打つように動いて食べ物を送る運動。ミミズが動くイメージ！",
    keyPoint: "食道から大腸まで、消化管の平滑筋が収縮と弛緩をくり返して食物を先へ送ります。自分の意志ではコントロールできません。",
    funFact: "🐛 蠕動運動のおかげで、逆立ちしても食べ物は胃に届く！重力に関係なく動くんだよ！",
  },
  "消化管": {
    emoji: "🪈",
    title: "消化管（しょうかかん）",
    summary: "口から肛門までつながる1本の管。食べ物を消化して栄養を吸収する通り道。",
    keyPoint: "口→食道→胃（噴門で入口・幽門で出口）→十二指腸→小腸→大腸→肛門の順に食物が通過。各所で消化液が分泌されます。",
    funFact: "📏 消化管の全長は約9メートル！身長の5〜6倍もの長さがあるんだよ！",
  },

  // ===== Ch.6 循環の国 =====
  "肺静脈": {
    emoji: "🔵",
    title: "肺静脈（はいじょうみゃく）",
    summary: "肺から心臓に動脈血を戻す血管。静脈なのに動脈血が流れる不思議な血管！",
    keyPoint: "肺で酸素を受け取った動脈血は、左右の肺から各2本ずつ計4本の肺静脈を通って左心房に流れ込みます。",
    funFact: "🔀 名前は『静脈』だけど中を流れるのは『動脈血』！名前と中身が逆なので注意！",
  },
  "左心室": {
    emoji: "💪",
    title: "左心室（さしんしつ）",
    summary: "心臓の中で最もパワフルな部屋。全身に血液を送り出すスーパーポンプ！",
    keyPoint: "肺から戻った動脈血は左心房→僧帽弁→左心室→大動脈弁→大動脈と進み全身へ送り出されます。右心室より心筋が厚い。",
    funFact: "💪 左心室の壁は右心室の約3倍の厚さ！全身に血液を届けるためにゴリゴリマッチョ！",
  },
  "心筋": {
    emoji: "💓",
    title: "心筋（しんきん）",
    summary: "心臓を構成する特別な筋肉。一生休まず動き続ける、体の中で一番頑張る筋肉！",
    keyPoint: "心臓は心筋でできた袋で、右心と左心からなります。心筋は自動的にリズムを作る不随意筋で、酸素と栄養は冠状動脈から供給。",
    funFact: "💓 心筋は一生の間に約25億回も収縮する！お休みなしで70年以上働き続けるよ！",
  },
  "肺動脈": {
    emoji: "🩸",
    title: "肺動脈（はいどうみゃく）",
    summary: "心臓から肺へ静脈血を送る血管。動脈なのに静脈血が流れる！",
    keyPoint: "全身から戻った静脈血は右心房→三尖弁→右心室→肺動脈弁→肺動脈を通って肺に送られ、ガス交換が行われます。",
    funFact: "🔀 『動脈』だけど中身は『静脈血』！血管名は心臓からの方向、血液名は酸素量で決まるよ！",
  },
  "静脈血": {
    emoji: "🟣",
    title: "静脈血（じょうみゃくけつ）",
    summary: "二酸化炭素を多く含んだ暗い赤色の血液。体中の老廃物を回収している。",
    keyPoint: "動脈血は酸素が多い血液、静脈血は二酸化炭素が多い血液。肺循環では肺動脈に静脈血、肺静脈に動脈血が流れるので注意！",
    funFact: "🟣 静脈が青く見えるのは皮膚を通した光の錯覚！実際の静脈血は暗い赤色だよ！",
  },
  "心臓": {
    emoji: "❤️",
    title: "心臓（しんぞう）",
    summary: "心筋でできた4つの部屋を持つポンプ。肺循環と体循環の2つのルートで血液を送る。",
    keyPoint: "右心房・右心室は肺循環（肺へ送る）、左心房・左心室は体循環（全身に送る）を担当。弁があることで血液の逆流を防いでいます。",
    funFact: "❤️ 心臓は1日に約10万回拍動し、約7,000リットルもの血液をポンプしている！",
  },

  // ===== Ch.7 呼吸の国 =====
  "葉": {
    emoji: "🌿",
    title: "葉（よう）※肺の区分",
    summary: "肺を分けた大きなブロック。右肺は3つ、左肺は2つに分かれている。",
    keyPoint: "右肺は上葉・中葉・下葉の3葉、左肺は上葉・下葉の2葉に分かれます。左肺の方が心臓があるため少し小さい。",
    funFact: "🫁 右肺が3つに分かれ左肺が2つなのは、左側に心臓が入っているスペースが必要だから！",
  },
  "気道": {
    emoji: "🌀",
    title: "気道（きどう）",
    summary: "口や鼻から入った空気が通る道のこと。空気の通り道の総称！",
    keyPoint: "気道は上気道（鼻腔・咽頭・喉頭）と下気道（気管・気管支）に分けられます。気管の内壁には異物を排出する繊毛があります。",
    funFact: "🌬️ 気管の長さは約10cm、直径は約2cm。ちょうどホースくらいのサイズだよ！",
  },
  "呼吸": {
    emoji: "🫁",
    title: "呼吸（こきゅう）",
    summary: "酸素を取り入れて二酸化炭素を出す生命活動。外呼吸と内呼吸がある。",
    keyPoint: "肺でのガス交換（外呼吸）と、体中の細胞と血液の間のガス交換（内呼吸）の2つがあります。嫌気呼吸は酸素を使わない呼吸。",
    funFact: "😮 人は1日に約2万回も呼吸をしている！寝ている間も休まず呼吸しているよ！",
  },
  "横隔膜": {
    emoji: "🎪",
    title: "横隔膜（おうかくまく）",
    summary: "胸腔と腹腔を仕切るドーム型の筋肉。息を吸うとき下がって肺を広げる！",
    keyPoint: "呼吸運動は横隔膜と肋骨の動きで行われます。吸気時には横隔膜が下がり肋骨が上がることで胸腔が広がります。",
    funFact: "🎪 横隔膜が痙攣するとしゃっくりが起こる！驚かされて止まるのは迷信だけど面白いよね！",
  },
  "肋骨": {
    emoji: "🦴",
    title: "肋骨（ろっこつ）",
    summary: "胸を囲む骨のカゴ。心臓や肺を守りつつ、呼吸運動を助ける。",
    keyPoint: "肋骨は左右に12対あります。呼吸時に上下に動いて胸腔の容積を変化させ、空気の出し入れを助けます。",
    funFact: "🦴 肋骨は意外と柔軟！深呼吸のたびに少しずつ動いて胸を広げたり縮めたりしてるよ！",
  },

  // ===== Ch.8 感覚の国 =====
  "感覚器官": {
    emoji: "👁️",
    title: "感覚器官（かんかくきかん）",
    summary: "外界からの刺激を受け取る器官。目・耳・鼻・舌・皮膚などがある。",
    keyPoint: "感覚器官が受け取った刺激は、感覚神経を通じて中枢神経（脳・脊髄）に伝えられ、そこで認識・処理されます。",
    funFact: "👁️ 人間の目は約1000万色を識別できる！カメラよりすごいセンサーだよ！",
  },
  "刺激": {
    emoji: "⚡",
    title: "刺激（しげき）",
    summary: "神経を興奮させるもの。光・音・温度・痛みなど、さまざまな種類がある。",
    keyPoint: "刺激が与えられると神経細胞の電位が逆転し（興奮）、電気信号として伝導します。次のニューロンへはシナプスを経て化学伝達物質で伝達。",
    funFact: "⚡ 神経の電気信号は秒速100メートル以上！新幹線より速い情報伝達だよ！",
  },
  "末梢神経": {
    emoji: "🕸️",
    title: "末梢神経（まっしょうしんけい）",
    summary: "脳と脊髄から枝分かれして全身に広がる神経ネットワーク。",
    keyPoint: "末梢神経には脳神経（12対）、脊髄神経（31対）、自律神経が含まれます。脳・脊髄自体は中枢神経であり末梢神経ではありません。",
    funFact: "🕸️ 末梢神経をぜんぶつなげると全長約100km！東京から箱根くらいの距離だよ！",
  },
  "中枢神経": {
    emoji: "🧠",
    title: "中枢神経（ちゅうすうしんけい）",
    summary: "脳と脊髄のこと。体のすべての情報を処理する司令本部！",
    keyPoint: "中枢神経は脳と脊髄からなります。大脳は感覚・運動・思考を、脊髄は反射や情報の中継を担当します。",
    funFact: "🧠 大脳には約860億個の神経細胞がある！宇宙の星の数に匹敵するよ！",
  },
  "神経": {
    emoji: "🔌",
    title: "神経（しんけい）",
    summary: "体中に張り巡らされた情報伝達の電線。電気信号と化学物質で刺激を伝える。",
    keyPoint: "神経細胞（ニューロン）は樹状突起・細胞体・軸索からなります。軸索が髄鞘に包まれた有髄神経は信号伝導が速い。末梢ではシュワン細胞が髄鞘を形成。",
    funFact: "🔌 最長のニューロンは腰から足先まで約1メートルもある！体内最長の細胞だよ！",
  },
  "シュワン細胞": {
    emoji: "🧤",
    title: "シュワン細胞",
    summary: "末梢神経で軸索を包んで絶縁する細胞。電気信号を効率よく伝えるための保護カバー！",
    keyPoint: "シュワン細胞は末梢神経で髄鞘を形成し、電気的な絶縁体の役割を果たします。これにより刺激が効率よく神経線維の中を伝わります。",
    funFact: "🧤 シュワン細胞の絶縁のおかげで有髄神経は無髄神経の約100倍の速さで信号を伝えるよ！",
  },

  // ===== Ch.9 最終決戦 =====
  "ミトコンドリア": {
    emoji: "⚡",
    title: "ミトコンドリア",
    summary: "細胞のエネルギー工場！ATPを合成する装置で、生命活動の原動力。",
    keyPoint: "ATPが分解するときのエネルギーで生命活動を維持。エネルギー代謝が盛んな細胞（骨格筋・心筋・肝臓・腎臓・神経）ほど数が多い。",
    funFact: "🏭 ミトコンドリアは独自のDNAを持っている。かつて別の生物が細胞に共生したという説がある！",
  },
  "染色体": {
    emoji: "🧬",
    title: "染色体（せんしょくたい）",
    summary: "DNAが折りたたまれてコンパクトになったもの。遺伝情報の入れ物！",
    keyPoint: "人間の細胞には22対の常染色体と1対の性染色体、全部で23対の染色体が存在します。DNAの塩基配列がタンパク質のアミノ酸配列を決定。",
    funFact: "🧬 1つの細胞の染色体に含まれるDNAをすべて伸ばすと約2mにもなるよ！",
  },
  "23対": {
    emoji: "🔢",
    title: "23対の染色体",
    summary: "ヒトの細胞にある染色体の数。22対の常染色体＋1対の性染色体＝計46本！",
    keyPoint: "常染色体22対は男女共通で、性染色体1対（XX=女性、XY=男性）が性別を決定します。全部で46本の染色体があります。",
    funFact: "🔢 チンパンジーは24対（48本）の染色体を持つ！たった1対の違いで人間とこんなに違う！",
  },
  "内分泌系": {
    emoji: "💉",
    title: "内分泌系（ないぶんぴつけい）",
    summary: "ホルモンを血液中に分泌して体の機能を調節するシステム。",
    keyPoint: "甲状腺・下垂体・膵臓・卵巣・精巣などがホルモンを分泌。導管を持たず血液中に放出されるのが外分泌腺との違い。腎臓は内分泌系に含まれない。",
    funFact: "💉 インスリンは膵臓のランゲルハンス島から分泌される。島の数はなんと100万〜200万個！",
  },

  // ===== 重複キーワード（複数章で使用） =====
  "リボソーム": {
    emoji: "🏭",
    title: "リボソーム",
    summary: "タンパク質を作る小さな工場。核からの指令に基づいてアミノ酸を組み立てる！",
    keyPoint: "核の指令でmRNAの情報を読み取り、必要なタンパク質を合成します。小胞体の周りや細胞質内に散らばっています。",
    funFact: "🔧 1つの細胞に数百万個のリボソームがある。しかも1秒間に20個もアミノ酸をつなげる超高速！",
  },
  "組織": {
    emoji: "🧩",
    title: "組織（そしき）",
    summary: "同じ形・同じ働きをする細胞が集まったグループ。筋組織・上皮組織などがある。",
    keyPoint: "組織は同種の細胞が集合したもので、特定の機能を持つ構造単位です。人体には上皮・結合・筋・神経の4種類の組織があります。",
    funFact: "🎭 人体にはたった4種類の組織しかない！でもこの4種類の組み合わせで全身ができてるよ！",
  },
  "器官": {
    emoji: "🫀",
    title: "器官（きかん）",
    summary: "複数の組織が組み合わさってできた、特定の仕事をする部分。心臓・肺・胃など。",
    keyPoint: "1つの器官は数種類の組織（細胞）から成り立ち、それぞれ独自の構造と機能を持って体内で働いています。",
    funFact: "❤️ 心臓は1日に約10万回も拍動！一生で約30億回もポンプしてくれる！",
  },
  "遺伝": {
    emoji: "🧬",
    title: "遺伝（いでん）",
    summary: "親の特徴が子に伝わること。目の色や血液型が似るのは遺伝のおかげ！",
    keyPoint: "遺伝情報はDNAの塩基配列に保存され、細胞分裂時にコピーされます。ABO血液型も遺伝子A・B・Oの組み合わせで決まります。",
    funFact: "🐼 パンダの白黒模様も遺伝。でも人間のDNAとパンダのDNAは約60%が同じ！",
  },
  "筋": {
    emoji: "💪",
    title: "筋（きん）",
    summary: "体を動かすための組織。骨格筋・心筋・平滑筋の3種類がある！",
    keyPoint: "筋には自分の意思で動かせる随意筋（骨格筋）と、動かせない不随意筋（心筋・平滑筋）があります。",
    funFact: "😊 笑顔を作るには12個の筋肉、しかめっ面には62個の筋肉が必要！笑った方が楽ちん！",
  },
  "血液": {
    emoji: "🩸",
    title: "血液（けつえき）",
    summary: "体の中を流れる赤い液体。体重の約1/13を占め、酸素や栄養を運び、病気と戦う。",
    keyPoint: "血液は細胞成分（赤血球・白血球・血小板）と液体成分（血漿）からなります。血漿の90%以上は水で、タンパク質やホルモンを含む。",
    funFact: "🌊 体重60kgの人の血液量は約5リットル。30%以上失うとショック状態になることも！",
  },
  "筋肉": {
    emoji: "💪",
    title: "筋肉（きんにく）",
    summary: "体を動かすための組織。骨格筋・心筋・平滑筋の3種類がある！",
    keyPoint: "骨格筋は骨に付着して関節を動かし、心筋は心臓の拍動を、平滑筋は消化管の蠕動運動を担います。筋骨格系に分類されます。",
    funFact: "🏃 人体には約400種類以上の骨格筋がある！体重の約40%を占めているよ！",
  },
  "ホメオスタシス（体液）": {
    emoji: "💧",
    title: "ホメオスタシス（体液）",
    summary: "体液の量や成分を一定に保つしくみ。腎臓が大活躍！",
    keyPoint: "腎臓は血液をろ過して老廃物を排出し、体液のバランスを維持します。くわしくは5章（腎臓）で学べます。",
    funFact: "🧪 腎臓は1日に約180リットルの血液をろ過している！すごい処理能力！",
  },
  "拍動性": {
    emoji: "💓",
    title: "拍動性（はくどうせい）",
    summary: "心臓が規則正しくリズミカルに収縮する性質。自分の意志で止められない！",
    keyPoint: "心筋は自動的にリズムを作る特殊な不随意筋で、洞結節がペースメーカーの役割を果たしています。",
    funFact: "🎵 安静時の心拍数は1分間に約60〜80回。運動すると200回近くまで上がる！",
  },
  "筋骨格系": {
    emoji: "🦴",
    title: "筋骨格系（きんこっかくけい）",
    summary: "筋肉・骨・腱・骨髄で構成される器官系。体を支え、動かす。",
    keyPoint: "筋骨格系に含まれるのは筋肉・骨・腱・骨髄など。心臓は筋骨格系には分類されません（循環器系に属する）。",
    funFact: "🏋️ 筋骨格系は体重の約60〜70%を占める！体の中でいちばん重い器官系だよ！",
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
