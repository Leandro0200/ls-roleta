import { useState } from "react";
import { carregarEstrategias, salvarEstrategias } from "../estrategias";
import { limparHistoricos } from "../services/analytics";
import "./AdminAvancado.css";

export default function AdminAvancado() {
  const [apiUrl, setApiUrl] = useState(() =>
  localStorage.getItem("ls_roleta_api_url") ||
  "https://ls-roleta-production.up.railway.app"
);
  const [confiancaMinima, setConfiancaMinima] = useState(() => Number(localStorage.getItem("ls_roleta_confianca_minima") || 80));
  const [estrategias, setEstrategias] = useState(() => carregarEstrategias());

  function salvar() {
    localStorage.setItem("ls_roleta_api_url", apiUrl);
    localStorage.setItem("ls_roleta_confianca_minima", String(confiancaMinima));
    salvarEstrategias(estrategias);
    alert("Configurações salvas.");
  }

  function alterarConfirmacao(valor) {
    const atualizado = {
      ...estrategias,
      confirmacaoDupla: {
        ...estrategias.confirmacaoDupla,
        ativa: valor
      }
    };
    setEstrategias(atualizado);
  }

  return (
    <section className="admin-avancado">
      <div className="admin-head">
        <div>
          <h2>⚙️ Painel Administrativo</h2>
          <p>Controle API, confiança mínima e regras principais do motor.</p>
        </div>
      </div>

      <div className="admin-grid">
        <label>
          <span>URL da API de números</span>
          <input
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="Ex: https://ls-roleta-production.up.railway.app"
          />
        </label>

        <label>
          <span>Confiança mínima para enviar sinal</span>
          <input
            type="number"
            min="1"
            max="100"
            value={confiancaMinima}
            onChange={(e) => setConfiancaMinima(Number(e.target.value))}
          />
        </label>

        <div className="admin-toggle">
          <span>Confirmação dupla</span>
          <button
            type="button"
            className={estrategias.confirmacaoDupla?.ativa ? "on" : ""}
            onClick={() => alterarConfirmacao(!estrategias.confirmacaoDupla?.ativa)}
          >
            {estrategias.confirmacaoDupla?.ativa ? "ATIVA" : "DESATIVADA"}
          </button>
        </div>
      </div>

      <div className="admin-actions">
        <button type="button" onClick={salvar}>Salvar configurações</button>
        <button type="button" className="ghost" onClick={limparHistoricos}>Limpar históricos</button>
      </div>
    </section>
  );
}
