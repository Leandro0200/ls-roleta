import "./SignalCard.css";

export default function SignalCard({ sinal }) {
  const temSinal = Boolean(sinal?.entrada || sinal?.entradaCurta);

  if (!temSinal) {
    return (
      <section className="signal-card-v20 waiting">
        <div className="signal-badge waiting">AGUARDANDO</div>

        <h2>Nenhum sinal aberto</h2>
        <p className="signal-muted">
          O sistema está aguardando confirmação das estratégias.
        </p>

        <div className="signal-row">
          <span>🧠 Estratégia</span>
          <strong>{sinal?.estrategia || "Aguardando"}</strong>
        </div>

        <div className="signal-row">
          <span>📊 Confiança</span>
          <strong>{sinal?.confianca || 0}%</strong>
        </div>
      </section>
    );
  }

  const entrada = sinal.entradaCurta || sinal.entrada;
  const estrategias = String(sinal.estrategia || "Estratégia")
    .split("+")
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <section className="signal-card-v20 active">
      <div className="signal-badge live">🟢 NOVO SINAL</div>

      <div className="signal-main">
        <span>🎯 ENTRADA</span>
        <strong>{entrada}</strong>
      </div>

      <div className="signal-zero">
        <span>🟢 COBERTURA</span>
        <strong>0️⃣ ZERO</strong>
      </div>

      <div className="signal-row">
        <span>🛡 PROTEÇÃO</span>
        <strong>{sinal.protecao || "Gale 2"}</strong>
      </div>

      <div className="signal-strategies">
        <span>🧠 ESTRATÉGIAS</span>
        <div>
          {estrategias.map((item, index) => (
            <b key={index}>✓ {item}</b>
          ))}
        </div>
      </div>

      <div className="confidence-box">
        <div className="confidence-title">
          <span>📊 CONFIANÇA</span>
          <strong>{sinal.confianca || 0}%</strong>
        </div>
        <div className="confidence-bar">
          <i style={{ width: `${Math.min(100, Number(sinal.confianca || 0))}%` }} />
        </div>
      </div>

      <div className="signal-footer">
        <span>⏱ Próximo giro</span>
        {sinal.confirmacoes ? <strong>{sinal.confirmacoes} confirmações</strong> : null}
      </div>
    </section>
  );
}
