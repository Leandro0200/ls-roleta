const VERMELHOS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

const DEFAULT_CONFIG = {
  paridade: { active: true, min: 5, gale: 2, conf: 76, coverZero: true },
  cores: { active: true, min: 4, gale: 2, conf: 78, coverZero: true },
  "alto-baixo": { active: true, min: 4, gale: 2, conf: 72, coverZero: true },

  // DÚZIAS - agora separadas em 2 estratégias independentes
  duziasSequencia: { active: true, min: 3, gale: 2, conf: 73, coverZero: true },
  duziasAusente: { active: true, min: 7, gale: 2, conf: 70, coverZero: true },

  // COLUNAS - agora separadas em 2 estratégias independentes
  colunasSequencia: { active: true, min: 3, gale: 2, conf: 74, coverZero: true },
  colunasAusente: { active: true, min: 7, gale: 2, conf: 70, coverZero: true },

  // Compatibilidade com versões antigas do painel
  duzias: { active: true, min: 3, gale: 2, conf: 73, coverZero: true },
  colunas: { active: true, min: 7, gale: 2, conf: 70, coverZero: true },

  // Mantidas, mas desativadas para não aparecer texto tipo "6/10"
  alternancia: { active: false, min: 6, gale: 1, conf: 70, coverZero: true },
  tendencia: { active: false, min: 7, gale: 2, conf: 74, coverZero: true },
};

export function normalizarConfiguracoes(configs = []) {
  const mapa = { ...DEFAULT_CONFIG };

  if (Array.isArray(configs)) {
    for (const item of configs) {
      if (!item?.id) continue;

      mapa[item.id] = {
        ...(mapa[item.id] || {}),
        active: Boolean(item.active),
        min: Number(item.min ?? mapa[item.id]?.min ?? 3),
        gale: Number(item.gale ?? mapa[item.id]?.gale ?? 2),
        conf: Number(item.conf ?? mapa[item.id]?.conf ?? 70),
        coverZero: item.coverZero !== false,
        mesas: item.mesas || {}
      };
    }
  }

  return mapa;
}

export function analisarMesa(historico = [], mesaId = "xxxtreme", mesa = "Mesa", strategyConfigs = []) {
  const config = normalizarConfiguracoes(strategyConfigs);

  const lista = historico
    .filter((r) => r && Number.isInteger(Number(r.numero)))
    .slice(0, 30);

  if (lista.length < 5) {
    return semSinal(mesaId, mesa, "Aguardando mínimo de 5 giros.", config);
  }

  const sinais = [];

  if (estrategiaAtiva(config, "cores", mesaId)) {
    const s = sinalSequenciaCor(lista, mesaId, mesa, config.cores);
    if (s) sinais.push(s);
  }

  if (estrategiaAtiva(config, "paridade", mesaId)) {
    const s = sinalParImpar(lista, mesaId, mesa, config.paridade);
    if (s) sinais.push(s);
  }

  if (estrategiaAtiva(config, "alto-baixo", mesaId)) {
    const s = sinalAltoBaixo(lista, mesaId, mesa, config["alto-baixo"]);
    if (s) sinais.push(s);
  }

  // DÚZIAS: sequência e ausência agora são estratégias separadas.
  // O ID antigo "duzias" continua funcionando como sequência para compatibilidade.
  if (estrategiaAtiva(config, "duziasSequencia", mesaId) || estrategiaAtiva(config, "duzias", mesaId)) {
    const cfg = estrategiaAtiva(config, "duziasSequencia", mesaId) ? config.duziasSequencia : config.duzias;
    const s = sinalDuziaSequencia(lista, mesaId, mesa, cfg);
    if (s) sinais.push(s);
  }

  if (estrategiaAtiva(config, "duziasAusente", mesaId)) {
    const s = sinalDuziaAusente(lista, mesaId, mesa, config.duziasAusente);
    if (s) sinais.push(s);
  }

  // COLUNAS: sequência e ausência agora são estratégias separadas.
  // O ID antigo "colunas" continua funcionando como ausência para compatibilidade.
  if (estrategiaAtiva(config, "colunasSequencia", mesaId)) {
    const s = sinalColunaSequencia(lista, mesaId, mesa, config.colunasSequencia);
    if (s) sinais.push(s);
  }

  if (estrategiaAtiva(config, "colunasAusente", mesaId) || estrategiaAtiva(config, "colunas", mesaId)) {
    const cfg = estrategiaAtiva(config, "colunasAusente", mesaId) ? config.colunasAusente : config.colunas;
    const s = sinalColunaAusente(lista, mesaId, mesa, cfg);
    if (s) sinais.push(s);
  }

  // Alternância e tendência ficam fora da análise principal para evitar sinais por frequência tipo 6/10.

  const melhor = sinais.sort((a, b) => percentNumber(b.confianca) - percentNumber(a.confianca))[0];

  return melhor || semSinal(mesaId, mesa, "Nenhuma estratégia ativa confirmou entrada.", config);
}

function estrategiaAtiva(config, id, mesaId) {
  const cfg = config[id];
  if (!cfg?.active) return false;
  if (cfg.mesas && Object.keys(cfg.mesas).length && cfg.mesas[mesaId] === false) return false;
  return true;
}

function montarSinal({ mesaId, mesa, tipo, entrada, estrategia, motivo, confianca = 72, cfg = {} }) {
  const entradaLimpa = limparEntrada(entrada);
  const galeMax = Number(cfg.gale ?? 2);
  const coberturaZero = cfg.coverZero !== false;

  return {
    ativo: true,
    mesaId,
    mesa,

    status: "AGUARDANDO ENTRADA",
    statusOperacao: "aguardando_entrada",

    entrada: entradaLimpa,
    entradaFormatada: entrada,

    cobertura: coberturaZero ? "ZERO" : "SEM ZERO",
    coberturaZero,

    galeMax,
    progressao: `Até Gale ${galeMax}`,

    protecao: coberturaZero ? "ZERO" : "SEM ZERO",
    gale: `Gale ${galeMax}`,

    tipo,
    estrategia,
    motivo,
    confianca: `${Math.max(Number(cfg.conf || confianca), confianca)}%`,
    confirmacoes: 1,

    criadoEm: new Date().toISOString()
  };
}

function semSinal(mesaId, mesa, motivo) {
  return {
    ativo: false,
    mesaId,
    mesa,
    status: "AGUARDANDO",
    statusOperacao: "sem_sinal",
    entrada: "",
    cobertura: "ZERO",
    coberturaZero: true,
    galeMax: 2,
    progressao: "Até Gale 2",
    texto: "Sem sinal seguro agora",
    motivo,
    confianca: "0%",
    votos: [],
    criadoEm: new Date().toISOString()
  };
}

function sinalSequenciaCor(lista, mesaId, mesa, cfg) {
  const s = contarSequencia(lista, cor);
  const min = Number(cfg.min || 4);

  if (s.valor === "vermelho" && s.qtd >= min) {
    return montarSinal({
      mesaId, mesa, tipo: "cor", entrada: "⚫ Preto",
      estrategia: "Sequência de Cor",
      motivo: `Sequência de ${s.qtd} vermelhos`,
      confianca: s.qtd >= 4 ? 78 : 72,
      cfg
    });
  }

  if (s.valor === "preto" && s.qtd >= min) {
    return montarSinal({
      mesaId, mesa, tipo: "cor", entrada: "🔴 Vermelho",
      estrategia: "Sequência de Cor",
      motivo: `Sequência de ${s.qtd} pretos`,
      confianca: s.qtd >= 4 ? 78 : 72,
      cfg
    });
  }

  return null;
}

function sinalParImpar(lista, mesaId, mesa, cfg) {
  const s = contarSequencia(lista, paridade);
  const min = Number(cfg.min || 5);

  if (s.valor === "par" && s.qtd >= min) {
    return montarSinal({
      mesaId, mesa, tipo: "paridade", entrada: "Ímpar",
      estrategia: "Sequência Par/Ímpar",
      motivo: `Sequência de ${s.qtd} pares`,
      confianca: s.qtd >= 5 ? 76 : 70,
      cfg
    });
  }

  if (s.valor === "impar" && s.qtd >= min) {
    return montarSinal({
      mesaId, mesa, tipo: "paridade", entrada: "Par",
      estrategia: "Sequência Par/Ímpar",
      motivo: `Sequência de ${s.qtd} ímpares`,
      confianca: s.qtd >= 5 ? 76 : 70,
      cfg
    });
  }

  return null;
}

function sinalAltoBaixo(lista, mesaId, mesa, cfg) {
  const s = contarSequencia(lista, altoBaixo);
  const min = Number(cfg.min || 4);

  if (s.valor === "alto" && s.qtd >= min) {
    return montarSinal({ mesaId, mesa, tipo: "alto-baixo", entrada: "Baixo 1-18", estrategia: "Sequência Alto/Baixo", motivo: `Sequência de ${s.qtd} altos`, confianca: 72, cfg });
  }

  if (s.valor === "baixo" && s.qtd >= min) {
    return montarSinal({ mesaId, mesa, tipo: "alto-baixo", entrada: "Alto 19-36", estrategia: "Sequência Alto/Baixo", motivo: `Sequência de ${s.qtd} baixos`, confianca: 72, cfg });
  }

  return null;
}

function sinalDuziaSequencia(lista, mesaId, mesa, cfg) {
  const min = Number(cfg.min || 3);

  const ultimas = lista
    .slice(0, min)
    .map((r) => duzia(r.numero));

  if (ultimas.length < min) return null;
  if (ultimas.includes("zero")) return null;

  const duziaRepetida = ultimas[0];
  const repetiu = ultimas.every((d) => d === duziaRepetida);

  if (!repetiu) return null;

  const entrada = ["1ª dúzia", "2ª dúzia", "3ª dúzia"]
    .filter((d) => d !== duziaRepetida)
    .join(" + ");

  return montarSinal({
    mesaId,
    mesa,
    tipo: "duzia",
    entrada,
    estrategia: "Sequência de Dúzia",
    motivo: `Sequência de ${min} na ${duziaRepetida}`,
    confianca: 73,
    cfg
  });
}

function sinalDuziaAusente(lista, mesaId, mesa, cfg) {
  const qtd = Number(cfg.min || 7);
  const ultimas = lista
    .slice(0, qtd)
    .map((r) => duzia(r.numero))
    .filter((v) => v !== "zero");

  if (ultimas.length < qtd) return null;

  const contagem = contar(ultimas);

  for (const d of ["1ª dúzia", "2ª dúzia", "3ª dúzia"]) {
    if (!contagem[d]) {
      return montarSinal({
        mesaId,
        mesa,
        tipo: "duzia",
        entrada: d,
        estrategia: "Dúzia Ausente",
        motivo: `${d} não saiu nos últimos ${ultimas.length} giros`,
        confianca: 70,
        cfg
      });
    }
  }

  return null;
}

function sinalColunaSequencia(lista, mesaId, mesa, cfg) {
  const min = Number(cfg.min || 3);

  const ultimas = lista
    .slice(0, min)
    .map((r) => coluna(r.numero));

  if (ultimas.length < min) return null;
  if (ultimas.includes("zero")) return null;

  const colunaRepetida = ultimas[0];
  const repetiu = ultimas.every((c) => c === colunaRepetida);

  if (!repetiu) return null;

  const entrada = ["1ª coluna", "2ª coluna", "3ª coluna"]
    .filter((c) => c !== colunaRepetida)
    .join(" + ");

  return montarSinal({
    mesaId,
    mesa,
    tipo: "coluna",
    entrada,
    estrategia: "Sequência de Coluna",
    motivo: `Sequência de ${min} na ${colunaRepetida}`,
    confianca: 74,
    cfg
  });
}

function sinalColunaAusente(lista, mesaId, mesa, cfg) {
  const qtd = Number(cfg.min || 7);
  const ultimos = lista
    .slice(0, qtd)
    .map((r) => coluna(r.numero))
    .filter((v) => v !== "zero");

  if (ultimos.length < qtd) return null;

  const contagem = contar(ultimos);

  for (const c of ["1ª coluna", "2ª coluna", "3ª coluna"]) {
    if (!contagem[c]) {
      return montarSinal({
        mesaId,
        mesa,
        tipo: "coluna",
        entrada: c,
        estrategia: "Coluna Ausente",
        motivo: `${c} não saiu nos últimos ${ultimos.length} giros`,
        confianca: 70,
        cfg
      });
    }
  }

  return null;
}

// Mantidas somente para compatibilidade. Não são chamadas no motor principal.
function sinalAlternanciaCor(lista, mesaId, mesa, cfg) {
  const qtd = Number(cfg.min || 6);
  const cores = lista.slice(0, qtd).map((r) => cor(r.numero));
  if (cores.includes("verde")) return null;
  const alternando = cores.every((c, i) => i === 0 || c !== cores[i - 1]);

  if (!alternando) return null;

  const entrada = cores[0] === "vermelho" ? "⚫ Preto" : "🔴 Vermelho";
  return montarSinal({ mesaId, mesa, tipo: "cor", entrada, estrategia: "Alternância de Cor", motivo: `${qtd} giros alternando cor`, confianca: 72, cfg });
}

function sinalTendenciaCor(lista, mesaId, mesa, cfg) {
  const qtd = 10;
  const min = Number(cfg.min || 7);
  const ultimos = lista.slice(0, qtd);
  const vermelhos = ultimos.filter((r) => cor(r.numero) === "vermelho").length;
  const pretos = ultimos.filter((r) => cor(r.numero) === "preto").length;

  if (vermelhos >= min) {
    return montarSinal({ mesaId, mesa, tipo: "cor", entrada: "⚫ Preto", estrategia: "Tendência de Cor", motivo: `vermelho saiu ${vermelhos}/10`, confianca: 74, cfg });
  }

  if (pretos >= min) {
    return montarSinal({ mesaId, mesa, tipo: "cor", entrada: "🔴 Vermelho", estrategia: "Tendência de Cor", motivo: `preto saiu ${pretos}/10`, confianca: 74, cfg });
  }

  return null;
}

function cor(n) {
  const num = Number(n);
  if (num === 0) return "verde";
  return VERMELHOS.includes(num) ? "vermelho" : "preto";
}

function paridade(n) {
  const num = Number(n);
  if (num === 0) return "zero";
  return num % 2 === 0 ? "par" : "impar";
}

function altoBaixo(n) {
  const num = Number(n);
  if (num === 0) return "zero";
  return num <= 18 ? "baixo" : "alto";
}

function duzia(n) {
  const num = Number(n);
  if (num === 0) return "zero";
  if (num <= 12) return "1ª dúzia";
  if (num <= 24) return "2ª dúzia";
  return "3ª dúzia";
}

function coluna(n) {
  const num = Number(n);
  if (num === 0) return "zero";
  if (num % 3 === 1) return "1ª coluna";
  if (num % 3 === 2) return "2ª coluna";
  return "3ª coluna";
}

function contarSequencia(lista, fn) {
  const primeiro = fn(lista[0].numero);
  if (primeiro === "zero") return { valor: primeiro, qtd: 1 };

  let qtd = 0;
  for (const item of lista) {
    const v = fn(item.numero);
    if (v === primeiro) qtd += 1;
    else break;
  }

  return { valor: primeiro, qtd };
}

function contar(arr) {
  return arr.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});
}

function percentNumber(value) {
  return Number(String(value || "").replace(/[^0-9]/g, "")) || 0;
}

function limparEntrada(texto) {
  return String(texto).replace(/🔴|⚫|🟢/g, "").trim().toUpperCase();
}
