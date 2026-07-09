import { useMemo, useState } from "react";
import { carregarEstrategias, salvarEstrategias, estrategiaPadrao } from "../estrategias";
import "./ConfigEstrategias.css";

export default function ConfigEstrategias() {
  const [estrategias, setEstrategias] = useState(() => carregarEstrategias());
  const ativas = useMemo(
    () => Object.values(estrategias).filter((item) => item.ativa).length,
    [estrategias]
  );

  function alterar(chave, campo, valor) {
    const atualizado = {
      ...estrategias,
      [chave]: {
        ...estrategias[chave],
        [campo]: valor
      }
    };

    setEstrategias(atualizado);
    salvarEstrategias(atualizado);
  }

  function restaurar() {
    setEstrategias(estrategiaPadrao);
    salvarEstrategias(estrategiaPadrao);
  }

  return (
    <section className="estrategias-config-card">
      <div className="estrategias-config-head">
        <div>
          <h2>🧠 Estratégias</h2>
          <p>Configure as regras que geram sinais sem mexer no código.</p>
        </div>

        <div className="estrategias-config-status">
          <strong>{ativas}</strong>
          <span>ativas</span>
        </div>
      </div>

      <div className="estrategias-grid">
        {Object.entries(estrategias).map(([chave, item]) => (
          <article key={chave} className={`estrategia-item ${item.ativa ? "ativa" : ""}`}>
            <div className="estrategia-top">
              <div>
                <h3>{item.nome}</h3>
                <p>{item.descricao}</p>
              </div>

              <button
                type="button"
                className={`toggle-estrategia ${item.ativa ? "on" : ""}`}
                onClick={() => alterar(chave, "ativa", !item.ativa)}
              >
                {item.ativa ? "ON" : "OFF"}
              </button>
            </div>

            <div className="estrategia-controls">
              <label>
                <span>Sequência mínima</span>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={item.minimo}
                  onChange={(e) => alterar(chave, "minimo", Number(e.target.value))}
                />
              </label>

              <label>
                <span>Gale</span>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={item.gale}
                  onChange={(e) => alterar(chave, "gale", Number(e.target.value))}
                />
              </label>

              <label>
                <span>Confiança</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={item.confianca}
                  onChange={(e) => alterar(chave, "confianca", Number(e.target.value))}
                />
              </label>
            </div>
          </article>
        ))}
      </div>

      <div className="estrategias-actions">
        <button type="button" onClick={restaurar}>Restaurar padrão</button>
        <small>As alterações ficam salvas no navegador.</small>
      </div>
    </section>
  );
}
