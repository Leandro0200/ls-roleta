import { useMemo } from "react";
import { criarResumoHistorico } from "../services/analytics";
import "./DashboardInteligente.css";

export default function DashboardInteligente({ historico = [], sinais = [] }) {
  const resumo = useMemo(() => criarResumoHistorico(historico, sinais), [historico, sinais]);

  return (
    <section className="dashboard-inteligente">
      <div className="dash-card">
        <span>🎰 Giros</span>
        <strong>{resumo.totalGiros}</strong>
        <small>últimos resultados</small>
      </div>

      <div className="dash-card">
        <span>🎯 Último número</span>
        <strong>{resumo.ultimoNumero ?? "--"}</strong>
        <small>capturado pela API</small>
      </div>

      <div className="dash-card green">
        <span>✅ Assertividade</span>
        <strong>{resumo.sinais.assertividade}%</strong>
        <small>{resumo.sinais.green} green / {resumo.sinais.red} red</small>
      </div>

      <div className="dash-card gold">
        <span>🧠 Melhor estratégia</span>
        <strong>{resumo.rankingEstrategias[0]?.nome || "Aguardando"}</strong>
        <small>{resumo.rankingEstrategias[0]?.assertividade || 0}%</small>
      </div>
    </section>
  );
}
