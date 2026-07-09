import "./RoulettePremiumBG.css";

export default function RoulettePremiumBG() {
  return (
    <div className="premium-roulette-stage">
      <div className="premium-roulette-image" />
      <div className="premium-roulette-glow glow-left" />
      <div className="premium-roulette-glow glow-right" />
      <div className="premium-roulette-shine" />
      <div className="premium-roulette-gold-sweep" />
      <div className="premium-card-depth" />
      <div className="premium-roulette-vignette" />

      <div className="premium-particles">
        {Array.from({ length: 34 }).map((_, index) => (
          <i
            key={index}
            style={{
              "--x": `${8 + ((index * 13) % 86)}%`,
              "--y": `${12 + ((index * 19) % 58)}%`,
              "--d": `${2 + (index % 7)}s`,
              "--s": `${4 + (index % 9)}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
