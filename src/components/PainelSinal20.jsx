import { useMemo } from "react";
import SignalCard from "./SignalCard";
import { avaliarEstrategias, carregarEstrategias } from "../estrategias";
import "./PainelSinal20.css";

export default function PainelSinal20({ historico = [], sinal }) {
  const estrategias = useMemo(() => carregarEstrategias(), []);
  const sinalCalculado = useMemo(
    () => sinal || avaliarEstrategias(historico, estrategias),
    [historico, sinal, estrategias]
  );

  return (
    <div className="painel-sinal-20">
      <SignalCard sinal={sinalCalculado} />
    </div>
  );
}
