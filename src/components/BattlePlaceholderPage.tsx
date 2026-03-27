type BattlePlaceholderPageProps = {
  onHome: () => void;
};

export default function BattlePlaceholderPage({ onHome }: BattlePlaceholderPageProps) {
  return (
    <section className="screen placeholder-screen">
      <h2>Battle: Please make your way to the exit Women</h2>
      <p>This battle is a placeholder for now and can be added into the same battle system later.</p>
      <div className="placeholder-sprite">
        <img src="/placeholders/exit-woman-placeholder.svg" alt="Placeholder sprite for exit women battle" />
      </div>
      <button type="button" className="pixel-button" onClick={onHome}>
        Back Home
      </button>
    </section>
  );
}
