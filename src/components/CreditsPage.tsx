type CreditsPageProps = {
  onHome: () => void;
};

export default function CreditsPage({ onHome }: CreditsPageProps) {
  return (
    <section className="screen credits-screen">
      <h2>Credits</h2>
      <p>By Henry</p>
      <p>Sprites by Giulio</p>
      <button type="button" className="pixel-button" onClick={onHome}>
        Back Home
      </button>
    </section>
  );
}
