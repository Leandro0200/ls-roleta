import { useEffect, useState } from "react";
import { carregarTempoReal } from "../services/tempoRealApi";
import SignalCard from "./SignalCard";
import "./TempoReal23.css";

export default function TempoReal23() {
  const [dados, setDados] = useState({
    online: false,
    numeros: [],
    historico: [],
    sinal: null,
    updatedAt: null,
  });

  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    async function atualizar() {
      try {
        const novosDados = await carregarTempoReal();
        if (!ativo) return;
        setDados(novosDados);
        setErro("");
      } catch (e) {
        if (!ativo) return;
        setErro("API offline ou sem resposta.");
        setDados((atual) => ({ ...atual, online: false }));
      }
    }

    atualizar();
    const timer = setInterval(atualizar, 10000);

    return () => {
      ativo = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <section className="tempo-real-23">
      <div className="tempo-real-head">
        <div>
          <h2>📡 Tempo real</h2>
          <p>Atualização automática pela API online.</p>
        </div>

        <div className={`tempo-real-status ${dados.online ? "on" : "off"}`}>
          <strong>{dados.online ? "AO VIVO" : "OFFLINE"}</strong>
          <span>
            {dados.updatedAt
              ? new Date(dados.updatedAt).toLocaleTimeString("pt-BR")
              : "aguardando"}
          </span>
        </div>
      </div>

      {erro ? <div className="tempo-real-error">{erro}</div> : null}

      <div className="tempo-real-grid">
        <SignalCard sinal={dados.sinal} />

        <div className="tempo-real-history">
          <h3>🎲 Últimos números</h3>
          <div className="numbers-list">
            {dados.numeros.slice(0, 20).map((numero, index) => (
              <span key={`${numero}-${index}`} className={numero === 0 ? "zero" : ""}>
                {numero}
              </span>
            ))}
          </div>

          <div className="tempo-real-info">
            <div>
              <b>{dados.numeros[0] ?? "--"}</b>
              <small>último número</small>
            </div>
            <div>
              <b>{dados.numeros.length}</b>
              <small>giros carregados</small>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
