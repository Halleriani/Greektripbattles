type WinPageProps = {
  onHome: () => void;
  characterName: string;
};

export default function WinPage({ onHome, characterName }: WinPageProps) {
  return (
    <section className="screen win-screen">
      <h2>You win congratulations page!</h2>
      <p>You beat {characterName}!</p>
      <button type="button" className="pixel-button" onClick={onHome}>
        Go back to home
      </button>
    </section>
  );
}
