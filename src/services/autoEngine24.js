import { getApiHistory, getApiSignal } from "./onlineApi";
import { notificarNovoSinal } from "./notifications";

let ultimoSinalKey = "";

export async function atualizarMotorAutomatico() {
  const historico = await getApiHistory();
  const numeros = historico.numeros || [];
  const sinalData = await getApiSignal(numeros);
  const sinal = sinalData.sinal;

  const key = sinal?.entradaCurta
    ? `${sinal.entradaCurta}-${sinal.estrategia}-${sinal.confianca}`
    : "";

  if (key && key !== ultimoSinalKey) {
    ultimoSinalKey = key;
    await notificarNovoSinal(sinal);
  }

  return {
    numeros,
    historico: historico.historico || [],
    sinal,
    updatedAt: sinalData.updatedAt
  };
}

export async function buscarEstatisticasOnline() {
  const res = await fetch("/api/stats", { cache: "no-store" });
  if (!res.ok) throw new Error("Erro ao buscar estatísticas");
  return res.json();
}
