import { getApiHistory, getApiSignal, getApiStatus } from "./onlineApi";

export async function carregarTempoReal() {
  const status = await getApiStatus();
  const historicoData = await getApiHistory();
  const numeros = historicoData.numeros || [];
  const sinalData = await getApiSignal(numeros);

  return {
    online: Boolean(status.online),
    status: status.status || "AO VIVO",
    numeros,
    historico: historicoData.historico || [],
    sinal: sinalData.sinal,
    updatedAt: sinalData.updatedAt || status.updatedAt
  };
}
