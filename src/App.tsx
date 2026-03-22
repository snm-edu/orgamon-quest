import { useState, useEffect } from "react";
import { useGameStore } from "./stores/gameStore";
import TitleScreen from "./screens/TitleScreen";
import HeroSelectScreen from "./screens/HeroSelectScreen";
import PlayerNameScreen from "./screens/PlayerNameScreen";
import HomeScreen from "./screens/HomeScreen";
import ChapterMapScreen from "./screens/ChapterMapScreen";
import TeamEditScreen from "./screens/TeamEditScreen";
import QuizScreen from "./screens/QuizScreen";
import BattleScreen from "./screens/BattleScreen";
import ResultScreen from "./screens/ResultScreen";
import ZukanScreen from "./screens/ZukanScreen";
import ShopScreen from "./screens/ShopScreen";
import SettingsScreen from "./screens/SettingsScreen";
import StoryScreen from "./screens/StoryScreen";
import ProfileScreen from "./screens/ProfileScreen";
import EndingScreen from "./screens/EndingScreen";

const screens: Record<string, () => React.JSX.Element | null> = {
  title: TitleScreen,
  hero_select: HeroSelectScreen,
  player_name: PlayerNameScreen,
  home: HomeScreen,
  chapter_map: ChapterMapScreen,
  team_edit: TeamEditScreen,
  quiz: QuizScreen,
  battle: BattleScreen,
  result: ResultScreen,
  zukan: ZukanScreen,
  shop: ShopScreen,
  settings: SettingsScreen,
  story: StoryScreen,
  profile: ProfileScreen,
  ending: EndingScreen,
};

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const [displayScreen, setDisplayScreen] = useState(screen);

  useEffect(() => {
    if (screen === displayScreen) return;
    const timer = setTimeout(() => {
      setDisplayScreen(screen);
    }, 150);
    return () => clearTimeout(timer);
  }, [screen, displayScreen]);

  const isTransitioning = screen !== displayScreen;

  const ScreenComponent = screens[displayScreen] || TitleScreen;

  return (
    <div className="h-[100dvh] max-w-md mx-auto relative overflow-hidden">
      <div
        className={`transition-all duration-200 ${
          isTransitioning
            ? "opacity-0 scale-[0.97] translate-y-2"
            : "opacity-100 scale-100 translate-y-0"
        }`}
      >
        <ScreenComponent />
      </div>
    </div>
  );
}
