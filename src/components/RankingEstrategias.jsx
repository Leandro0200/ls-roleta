import { useMemo } from "react";
import { criarResumoHistorico } from "../services/analytics";
import "./RankingEstrategias.css";

export default function RankingEstrategias({ historico = [], sinais = [] }) {
  const resumo = useMemo(() => criarResumoHistorico(historico, sinais), [historico, sinais]);

  return (
    <section className="ranking-estrategias">
      <div className="ranking-head">
        <h2>📈 Ranking de estratégias</h2>
        <span>baseado nos sinais finalizados</span>
      </div>

      {resumo.rankingEstrategias.length ? (
        <div className="ranking-list">
          {resumo.rankingEstrategias.map((item, index) => (
            <div key={item.nome} className="ranking-item">
              <strong>#{index + 1}</strong>
              <div>
                <b>{item.nome}</b>
                <span>{item.green} green / {item.red} red</span>
              </div>
              <em>{item.assertividade}%</em>
            </div>
          ))}
        </div>
      ) : (
        <p className="ranking-empty">Ainda não há sinais finalizados para calcular o ranking.</p>
      )}
    </section>
  );
}
