import { useEffect, useState } from "react";
import { atualizarMotorAutomatico, buscarEstatisticasOnline } from "../services/autoEngine24";
import SignalCard from "./SignalCard";
import "./Automacao24.css";

export default function Automacao24() {
  const [dados, setDados] = useState({
    numeros: [],
    sinal: null,
    updatedAt: null
  });
  const [stats, setStats] = useState(null);
  const [online, setOnline] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const [motor, estatisticas] = await Promise.all([
          atualizarMotorAutomatico(),
          buscarEstatisticasOnline()
        ]);

        if (!ativo) return;
        setDados(motor);
        setStats(estatisticas);
        setOnline(true);
        setErro("");
      } catch (e) {
        if (!ativo) return;
        setOnline(false);
        setErro("Não foi possível atualizar a automação.");
      }
    }

    carregar();
    const timer = setInterval(carregar, 10000);

    return () => {
      ativo = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <section className="automacao-24">
      <div className="auto-head">
        <div>
          <h2>🤖 Automação 24.0</h2>
          <p>Motor online, sinal automático, estatísticas e notificações.</p>
        </div>

        <div className={`auto-status ${online ? "on" : "off"}`}>
          <strong>{online ? "ONLINE" : "OFFLINE"}</strong>
          <span>{dados.updatedAt ? new Date(dados.updatedAt).toLocaleTimeString("pt-BR") : "aguardando"}</span>
        </div>
      </div>

      {erro ? <div className="auto-error">{erro}</div> : null}

      <div className="auto-grid">
        <SignalCard sinal={dados.sinal} />

        <div className="auto-side">
          <div className="auto-stat-main">
            <span>📊 Assertividade geral</span>
            <strong>{stats?.resumo?.assertividade || 0}%</strong>
            <small>{stats?.resumo?.green || 0} green / {stats?.resumo?.red || 0} red</small>
          </div>

          <div className="auto-last">
            <h3>Últimos números</h3>
            <div>
              {dados.numeros.slice(0, 18).map((n, i) => (
                <b key={`${n}-${i}`} className={n === 0 ? "zero" : ""}>{n}</b>
              ))}
            </div>
          </div>

          <div className="auto-ranking">
            <h3>Ranking</h3>
            {(stats?.ranking || []).slice(0, 5).map((item) => (
              <p key={item.nome}>
                <span>{item.nome}</span>
                <strong>{item.assertividade}%</strong>
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
