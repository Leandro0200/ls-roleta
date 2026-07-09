export function criarResumoHistorico(historico = [], sinais = []) {
  const numeros = normalizarNumeros(historico);

  const cores = contar(numeros.map(corNumero));
  const colunas = contar(numeros.map(colunaNumero).filter(Boolean));
  const duzias = contar(numeros.map(duziaNumero).filter(Boolean));
  const paridade = contar(numeros.map(paridadeNumero).filter((v) => v !== "zero"));
  const altoBaixo = contar(numeros.map(altoBaixoNumero).filter((v) => v !== "zero"));

  const greens = sinais.filter((s) => s.status === "green").length;
  const reds = sinais.filter((s) => s.status === "red").length;
  const totalFinalizados = greens + reds;
  const assertividade = totalFinalizados ? Math.round((greens / totalFinalizados) * 100) : 0;

  const estrategias = {};
  sinais.forEach((sinal) => {
    const nome = sinal.estrategia || "Sem estratégia";
    if (!estrategias[nome]) {
      estrategias[nome] = { nome, green: 0, red: 0, total: 0, assertividade: 0 };
    }

    if (sinal.status === "green") estrategias[nome].green += 1;
    if (sinal.status === "red") estrategias[nome].red += 1;

    estrategias[nome].total = estrategias[nome].green + estrategias[nome].red;
    estrategias[nome].assertividade = estrategias[nome].total
      ? Math.round((estrategias[nome].green / estrategias[nome].total) * 100)
      : 0;
  });

  const rankingEstrategias = Object.values(estrategias)
    .sort((a, b) => b.assertividade - a.assertividade || b.total - a.total)
    .slice(0, 8);

  return {
    totalGiros: numeros.length,
    ultimoNumero: numeros[0] ?? null,
    cores,
    colunas,
    duzias,
    paridade,
    altoBaixo,
    sinais: {
      green: greens,
      red: reds,
      total: totalFinalizados,
      assertividade,
    },
    rankingEstrategias,
  };
}

export function salvarHistoricoNumero(numero) {
  const historico = carregarHistoricoNumeros();
  const novo = [Number(numero), ...historico].slice(0, 500);
  localStorage.setItem("ls_roleta_historico_numeros", JSON.stringify(novo));
  return novo;
}

export function carregarHistoricoNumeros() {
  try {
    return JSON.parse(localStorage.getItem("ls_roleta_historico_numeros") || "[]");
  } catch {
    return [];
  }
}

export function salvarHistoricoSinal(sinal) {
  const historico = carregarHistoricoSinais();
  const novo = [{ ...sinal, criadoEm: new Date().toISOString() }, ...historico].slice(0, 500);
  localStorage.setItem("ls_roleta_historico_sinais", JSON.stringify(novo));
  return novo;
}

export function carregarHistoricoSinais() {
  try {
    return JSON.parse(localStorage.getItem("ls_roleta_historico_sinais") || "[]");
  } catch {
    return [];
  }
}

export function limparHistoricos() {
  localStorage.removeItem("ls_roleta_historico_numeros");
  localStorage.removeItem("ls_roleta_historico_sinais");
}

function normalizarNumeros(historico) {
  return historico
    .map((item) => Number(item?.numero ?? item?.number ?? item?.resultado ?? item))
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 36);
}

function contar(lista) {
  return lista.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});
}

function corNumero(n) {
  if (n === 0) return "verde";
  const vermelhos = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
  return vermelhos.includes(n) ? "vermelho" : "preto";
}

function paridadeNumero(n) {
  if (n === 0) return "zero";
  return n % 2 === 0 ? "par" : "impar";
}

function altoBaixoNumero(n) {
  if (n === 0) return "zero";
  return n <= 18 ? "baixo" : "alto";
}

function duziaNumero(n) {
  if (n === 0) return null;
  if (n <= 12) return "1ª dúzia";
  if (n <= 24) return "2ª dúzia";
  return "3ª dúzia";
}

function colunaNumero(n) {
  if (n === 0) return null;
  if ([1,4,7,10,13,16,19,22,25,28,31,34].includes(n)) return "Coluna 1";
  if ([2,5,8,11,14,17,20,23,26,29,32,35].includes(n)) return "Coluna 2";
  return "Coluna 3";
}
