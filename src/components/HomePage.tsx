type HomePageProps = {
  onBattleShushMan: () => void;
  onBattleExitWomen: () => void;
  onCredits: () => void;
};

export default function HomePage({ onBattleShushMan, onBattleExitWomen, onCredits }: HomePageProps) {
  return (
    <section className="screen home-screen">
      <h1 className="home-title">Greek trip battles</h1>

      <div className="home-buttons-shell">
        <button type="button" className="pixel-button home-button" onClick={onBattleShushMan}>
          Battle Shush man
        </button>
        <button type="button" className="pixel-button home-button" onClick={onBattleExitWomen}>
          Battle "Please make your way to the exit Women"
        </button>
        <button type="button" className="pixel-button home-button" onClick={onCredits}>
          Credits
        </button>
      </div>
    </section>
  );
}
