import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { iniciarCasinoScores, CASINOSCORES_MESAS } from "./casinoScoresConnector.js";
import { analisarMesa, normalizarConfiguracoes } from "./strategyEngine.js";
import {
  statusWhatsApp,
  montarTextoSinal,
  enviarSinalWhatsApp
} from "./whatsapp.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const DATA_DIR = path.resolve("ls-roleta-api/data");
const HISTORICO_FILE = path.join(DATA_DIR, "historico.json");
const STRATEGIES_FILE = path.join(DATA_DIR, "strategy-configs.json");
const OPERACOES_FILE = path.join(DATA_DIR, "operacoes.json");
const MESAS_ATIVAS_FILE = path.join(DATA_DIR, "mesas-ativas.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let historico = carregarJson(HISTORICO_FILE, []);
let strategyConfigs = carregarJson(STRATEGIES_FILE, []);
let operacoes = carregarJson(OPERACOES_FILE, []);

function criarMapaMesasAtivas() {
  return Object.fromEntries(CASINOSCORES_MESAS.map((mesa) => [mesa.id, true]));
}

let mesasAtivas = {
  ...criarMapaMesasAtivas(),
  ...carregarJson(MESAS_ATIVAS_FILE, {})
};

let operacaoAtualPorMesa = {};
let ultimaOperacaoFinalizadaPorMesa = {};
let sinalAtualPorMesa = {};
let statusFonte = {
  online: false,
  fonte: "CasinoScores",
  atualizadoEm: null,
  mesas: {}
};

const VERMELHOS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

function carregarJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    return data || fallback;
  } catch {
    return fallback;
  }
}

function salvarJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Erro ao salvar:", file, err.message);
  }
}

function salvarHistorico() {
  salvarJson(HISTORICO_FILE, historico.slice(0, 30000));
}

function salvarStrategyConfigs() {
  salvarJson(STRATEGIES_FILE, strategyConfigs);
}

function salvarOperacoes() {
  salvarJson(OPERACOES_FILE, operacoes.slice(0, 2000));
}

function salvarMesasAtivas() {
  salvarJson(MESAS_ATIVAS_FILE, mesasAtivas);
}

function mesaEstaAtiva(mesaId) {
  // Resultados manuais continuam permitidos para testes.
  if (mesaId === "manual") return true;
  return mesasAtivas[mesaId] !== false;
}

function getMesaNome(mesaId) {
  return CASINOSCORES_MESAS.find((m) => m.id === mesaId)?.nome || "Mesa desconhecida";
}

function registrarNumero(numero, extra = {}) {
  const mesaId = extra.mesaId || "manual";
  const mesa = extra.mesa || getMesaNome(mesaId);

  const resultado = {
    numero,
    cor: corNumero(numero),
    paridade: numero === 0 ? "zero" : numero % 2 === 0 ? "par" : "impar",
    duzia: duziaNumero(numero),
    coluna: colunaNumero(numero),
    altoBaixo: altoBaixoNumero(numero),
    horario: new Date().toISOString(),
    ...extra,
    mesaId,
    mesa
  };

  const ultimoDaMesa = historico.find((r) => r.mesaId === mesaId);

  if (
    ultimoDaMesa &&
    ultimoDaMesa.numero === numero &&
    extra.horarioOriginal &&
    ultimoDaMesa.horarioOriginal === extra.horarioOriginal
  ) {
    return { duplicado: true, resultado, sinal: sinalAtualPorMesa[mesaId] || null, operacao: operacaoAtualPorMesa[mesaId] || null };
  }

  historico.unshift(resultado);
  historico = historico.slice(0, 30000);
  salvarHistorico();

  if (!mesaEstaAtiva(mesaId)) {
    const sinalPausado = {
      ativo: false,
      pausado: true,
      mesaId,
      mesa,
      status: "MESA DESATIVADA",
      statusOperacao: "mesa_desativada",
      entrada: "",
      cobertura: "ZERO",
      coberturaZero: true,
      galeMax: 2,
      progressao: "Até Gale 2",
      texto: "Mesa desativada no painel",
      motivo: "Ative esta mesa para gerar sinais e contabilizar Green/Loss.",
      confianca: "0%",
      criadoEm: new Date().toISOString()
    };

    sinalAtualPorMesa[mesaId] = sinalPausado;

    console.log("⏸️ Mesa desativada:", mesa, "| resultado armazenado sem processar operação");
    return {
      duplicado: false,
      ignorado: true,
      motivo: "mesa_desativada",
      resultado,
      sinal: sinalPausado,
      operacao: operacaoAtualPorMesa[mesaId] || null
    };
  }

  const operacao = processarOperacao(mesaId, resultado);
  const sinal = gerarOuManterSinal(mesaId, resultado, operacao);

  sinalAtualPorMesa[mesaId] = sinal;

  console.log("🎯 Resultado:", numero, resultado.cor, "|", mesa);
  console.log("🎮 Operação:", operacaoAtualPorMesa[mesaId] || "sem operação");
  console.log("🧠 Sinal 43.1:", sinal);

  return { duplicado: false, resultado, sinal, operacao: operacaoAtualPorMesa[mesaId] || null };
}

function gerarOuManterSinal(mesaId, resultado, operacaoProcessada) {
  const ativa = operacaoAtualPorMesa[mesaId];

  if (ativa && ["aguardando_resultado", "gale_1", "gale_2"].includes(ativa.statusOperacao)) {
    return formatarSinalDaOperacao(ativa);
  }

  if (operacaoProcessada?.finalizada) {
    return formatarSinalDaOperacao(operacaoProcessada.operacao);
  }

  const novoSinal = gerarSinal(mesaId);

  if (novoSinal?.ativo) {
    const op = criarOperacao(novoSinal, resultado);
    const sinalFormatado = formatarSinalDaOperacao(op);

    enviarSinalWhatsApp(sinalFormatado)
      .then((retorno) => {
        if (!retorno.ok) {
          console.error("❌ Sinal não enviado ao WhatsApp:", retorno.erro);
        }
      })
      .catch((erro) => {
        console.error("❌ Erro inesperado no WhatsApp:", erro.message);
      });

    ultimaOperacaoFinalizadaPorMesa[mesaId] = null;
    operacaoAtualPorMesa[mesaId] = op;
    operacoes.unshift(op);
    operacoes = operacoes.slice(0, 2000);
    salvarOperacoes();
    return sinalFormatado;
  }

  return novoSinal;
}

function criarOperacao(sinal, resultadoOrigem) {
  const id = `${sinal.mesaId}-${Date.now()}`;

  return {
    id,
    mesaId: sinal.mesaId,
    mesa: sinal.mesa,
    entrada: sinal.entrada,
    entradaFormatada: sinal.entradaFormatada || sinal.entrada,
    cobertura: sinal.cobertura || "ZERO",
    coberturaZero: sinal.coberturaZero !== false,
    tipo: sinal.tipo,
    estrategia: sinal.estrategia,
    motivo: sinal.motivo,
    confianca: sinal.confianca,
    galeAtual: 0,
    galeMax: Number(sinal.galeMax || 2),
    progressao: sinal.progressao || "Até Gale 2",
    status: "AGUARDANDO RESULTADO",
    statusOperacao: "aguardando_resultado",
    origemNumero: resultadoOrigem?.numero ?? null,
    origemHorario: resultadoOrigem?.horarioOriginal || resultadoOrigem?.horario || null,
    resultados: [],
    resultadoFinal: null,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
    finalizadoEm: null
  };
}

function processarOperacao(mesaId, resultado) {
  const op = operacaoAtualPorMesa[mesaId];

  if (!op || !["aguardando_resultado", "gale_1", "gale_2"].includes(op.statusOperacao)) {
    return null;
  }

  if (op.origemHorario && (resultado.horarioOriginal === op.origemHorario || resultado.horario === op.origemHorario)) {
    return null;
  }

  const bateu = resultadoBateEntrada(op, resultado);
  const zero = resultado.numero === 0 && op.coberturaZero;

  op.resultados.push({
    numero: resultado.numero,
    cor: resultado.cor,
    paridade: resultado.paridade,
    duzia: resultado.duzia,
    coluna: resultado.coluna,
    gale: op.galeAtual,
    horario: resultado.horario,
    horarioOriginal: resultado.horarioOriginal || null
  });

  op.atualizadoEm = new Date().toISOString();

  if (bateu || zero) {
    const label = zero
      ? (op.galeAtual === 0 ? "GREEN ZERO" : `GREEN ZERO G${op.galeAtual}`)
      : (op.galeAtual === 0 ? "GREEN" : `GREEN G${op.galeAtual}`);

    op.status = label;
    op.statusOperacao = zero ? "green_zero" : "green";
    op.resultadoFinal = {
      status: label,
      numero: resultado.numero,
      gale: op.galeAtual,
      coberturaZero: zero
    };
    op.finalizadoEm = new Date().toISOString();

    operacaoAtualPorMesa[mesaId] = null;
    ultimaOperacaoFinalizadaPorMesa[mesaId] = op;
    atualizarOperacaoNoHistorico(op);
    salvarOperacoes();

    return { finalizada: true, operacao: op };
  }

  if (op.galeAtual < op.galeMax) {
    op.galeAtual += 1;
    op.status = `GALE ${op.galeAtual}`;
    op.statusOperacao = `gale_${op.galeAtual}`;
    atualizarOperacaoNoHistorico(op);
    salvarOperacoes();
    return { finalizada: false, operacao: op };
  }

  op.status = "LOSS";
  op.statusOperacao = "loss";
  op.resultadoFinal = {
    status: "LOSS",
    numero: resultado.numero,
    gale: op.galeAtual,
    coberturaZero: false
  };
  op.finalizadoEm = new Date().toISOString();

  operacaoAtualPorMesa[mesaId] = null;
  ultimaOperacaoFinalizadaPorMesa[mesaId] = op;
  atualizarOperacaoNoHistorico(op);
  salvarOperacoes();

  return { finalizada: true, operacao: op };
}

function atualizarOperacaoNoHistorico(op) {
  const idx = operacoes.findIndex((o) => o.id === op.id);
  if (idx >= 0) operacoes[idx] = op;
  else operacoes.unshift(op);
}

function resultadoBateEntrada(op, resultado) {
  const entrada = String(op.entrada || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (entrada.includes("VERMELHO")) return resultado.cor === "vermelho";
  if (entrada.includes("PRETO")) return resultado.cor === "preto";

  if (entrada === "PAR") return resultado.paridade === "par";
  if (entrada.includes("IMPAR")) return resultado.paridade === "impar";

  if (entrada.includes("BAIXO")) return resultado.altoBaixo === "baixo";
  if (entrada.includes("ALTO")) return resultado.altoBaixo === "alto";

  const duziasEntrada = [];
  if (entrada.includes("1ª DUZIA") || entrada.includes("1A DUZIA")) duziasEntrada.push("1ª dúzia");
  if (entrada.includes("2ª DUZIA") || entrada.includes("2A DUZIA")) duziasEntrada.push("2ª dúzia");
  if (entrada.includes("3ª DUZIA") || entrada.includes("3A DUZIA")) duziasEntrada.push("3ª dúzia");

  if (duziasEntrada.length) {
    return duziasEntrada.includes(resultado.duzia);
  }

  const colunasEntrada = [];
  if (entrada.includes("1ª COLUNA") || entrada.includes("1A COLUNA")) colunasEntrada.push("1ª coluna");
  if (entrada.includes("2ª COLUNA") || entrada.includes("2A COLUNA")) colunasEntrada.push("2ª coluna");
  if (entrada.includes("3ª COLUNA") || entrada.includes("3A COLUNA")) colunasEntrada.push("3ª coluna");

  if (colunasEntrada.length) {
    return colunasEntrada.includes(resultado.coluna);
  }

  return false;
}

function formatarSinalDaOperacao(op) {
  if (!op) return null;

  const finalizado = ["green", "green_zero", "loss"].includes(op.statusOperacao);

  return {
    ativo: !finalizado,
    finalizado,
    mesaId: op.mesaId,
    mesa: op.mesa,
    status: op.status,
    statusOperacao: op.statusOperacao,
    entrada: op.entrada,
    entradaFormatada: op.entradaFormatada,
    cobertura: op.cobertura,
    coberturaZero: op.coberturaZero,
    galeAtual: op.galeAtual,
    galeMax: op.galeMax,
    progressao: op.progressao,
    tipo: op.tipo,
    estrategia: op.estrategia,
    motivo: op.motivo,
    confianca: op.confianca,
    resultados: op.resultados,
    resultadoFinal: op.resultadoFinal,
    operacaoId: op.id,
    criadoEm: op.criadoEm,
    atualizadoEm: op.atualizadoEm
  };
}

function gerarSinal(mesaId = "auto") {
  const mesa = getMesaNome(mesaId);

  if (!mesaEstaAtiva(mesaId)) {
    return {
      ativo: false,
      pausado: true,
      mesaId,
      mesa,
      status: "MESA DESATIVADA",
      statusOperacao: "mesa_desativada",
      entrada: "",
      cobertura: "ZERO",
      coberturaZero: true,
      galeMax: 2,
      progressao: "Até Gale 2",
      texto: "Mesa desativada no painel",
      motivo: "Ative esta mesa para gerar sinais e contabilizar Green/Loss.",
      confianca: "0%",
      criadoEm: new Date().toISOString()
    };
  }

  const lista = historico.filter((r) => r.mesaId === mesaId);
  return analisarMesa(lista, mesaId, mesa, strategyConfigs);
}

function recalcularSinais() {
  for (const mesa of CASINOSCORES_MESAS) {
    if (!mesaEstaAtiva(mesa.id)) {
      sinalAtualPorMesa[mesa.id] = gerarSinal(mesa.id);
      continue;
    }

    if (!operacaoAtualPorMesa[mesa.id]) {
      sinalAtualPorMesa[mesa.id] = gerarSinal(mesa.id);
    }
  }
}

function estatisticasOperacoes(mesaId = null) {
  const lista = mesaId ? operacoes.filter((o) => o.mesaId === mesaId) : operacoes;
  const finalizadas = lista.filter((o) => ["green", "green_zero", "loss"].includes(o.statusOperacao));

  const greens = finalizadas.filter((o) => o.statusOperacao === "green" || o.statusOperacao === "green_zero").length;
  const greenZero = finalizadas.filter((o) => o.statusOperacao === "green_zero").length;
  const losses = finalizadas.filter((o) => o.statusOperacao === "loss").length;
  const greenDireto = finalizadas.filter((o) => o.resultadoFinal?.status === "GREEN").length;
  const greenG1 = finalizadas.filter((o) => o.resultadoFinal?.status?.includes("G1")).length;
  const greenG2 = finalizadas.filter((o) => o.resultadoFinal?.status?.includes("G2")).length;

  const abertas = lista.filter((o) => ["aguardando_resultado", "gale_1", "gale_2"].includes(o.statusOperacao)).length;

  return {
    total: finalizadas.length,
    abertas,
    greens,
    greenZero,
    greenDireto,
    greenG1,
    greenG2,
    losses,
    assertividade: finalizadas.length ? `${Math.round((greens / finalizadas.length) * 100)}%` : "0%"
  };
}

app.post("/resultado", (req, res) => {
  const numero = Number(req.body.numero);

  if (Number.isNaN(numero) || numero < 0 || numero > 36) {
    return res.status(400).json({ erro: "Número inválido" });
  }

  const r = registrarNumero(numero, {
    fonte: "manual",
    mesaId: req.body.mesaId || "manual",
    mesa: req.body.mesa || "Manual"
  });

  res.json({ ok: true, ...r });
});

app.get("/resultados", (req, res) => {
  const mesaId = req.query.mesaId;
  const limit = Number(req.query.limit || 500);
  const lista = mesaId ? historico.filter((r) => r.mesaId === mesaId) : historico;
  res.json(lista.slice(0, limit));
});

app.get("/estrategias", (req, res) => {
  res.json({
    ok: true,
    configs: strategyConfigs,
    normalizadas: normalizarConfiguracoes(strategyConfigs)
  });
});

app.post("/estrategias", (req, res) => {
  if (!Array.isArray(req.body.configs)) {
    return res.status(400).json({ ok: false, erro: "Envie { configs: [...] }" });
  }

  strategyConfigs = req.body.configs;
  salvarStrategyConfigs();
  recalcularSinais();

  res.json({
    ok: true,
    mensagem: "Estratégias salvas e aplicadas no motor.",
    configs: strategyConfigs
  });
});

app.get("/operacoes", (req, res) => {
  const mesaId = req.query.mesaId || null;
  const limit = Number(req.query.limit || 100);
  const lista = mesaId ? operacoes.filter((o) => o.mesaId === mesaId) : operacoes;

  res.json({
    ok: true,
    estatisticas: estatisticasOperacoes(mesaId),
    operacoes: lista.slice(0, limit)
  });
});

app.get("/mesas-ativas", (req, res) => {
  res.json({
    ok: true,
    mesasAtivas,
    atualizadasEm: new Date().toISOString()
  });
});

app.post("/mesas-ativas", (req, res) => {
  const recebidas = req.body?.mesasAtivas;

  if (!recebidas || typeof recebidas !== "object" || Array.isArray(recebidas)) {
    return res.status(400).json({
      ok: false,
      erro: "Envie { mesasAtivas: { auto: true, lightning: false, ... } }"
    });
  }

  const novoMapa = criarMapaMesasAtivas();

  for (const mesa of CASINOSCORES_MESAS) {
    if (Object.prototype.hasOwnProperty.call(recebidas, mesa.id)) {
      novoMapa[mesa.id] = recebidas[mesa.id] !== false;
    } else {
      novoMapa[mesa.id] = mesasAtivas[mesa.id] !== false;
    }
  }

  mesasAtivas = novoMapa;
  salvarMesasAtivas();
  recalcularSinais();

  res.json({
    ok: true,
    mensagem: "Mesas ativas atualizadas. Mesas OFF não geram sinais nem contabilizam Green/Loss.",
    mesasAtivas
  });
});

app.get("/mesas", (req, res) => {
  res.json(CASINOSCORES_MESAS.map((mesa) => {
    const h = historico.filter((r) => r.mesaId === mesa.id);
    const op = operacaoAtualPorMesa[mesa.id] || null;
    const finalizada = ultimaOperacaoFinalizadaPorMesa[mesa.id] || null;

    return {
      ...mesa,
      ativaNoMotor: mesaEstaAtiva(mesa.id),
      status: statusFonte.mesas?.[mesa.id] || null,
      ultimo: h[0] || null,
      historico: h.slice(0, 10),
      total: h.length,
      operacao: op,
      ultimaOperacao: finalizada,
      estatisticas: estatisticasOperacoes(mesa.id),
      sinal: op ? formatarSinalDaOperacao(op) : (finalizada ? formatarSinalDaOperacao(finalizada) : (sinalAtualPorMesa[mesa.id] || gerarSinal(mesa.id)))
    };
  }));
});

app.get("/sinal", (req, res) => {
  const mesaId = req.query.mesaId || "auto";
  const lista = historico.filter((r) => r.mesaId === mesaId);
  const op = operacaoAtualPorMesa[mesaId] || null;
  const finalizada = ultimaOperacaoFinalizadaPorMesa[mesaId] || null;
  const sinal = op ? formatarSinalDaOperacao(op) : (finalizada ? formatarSinalDaOperacao(finalizada) : (sinalAtualPorMesa[mesaId] || gerarSinal(mesaId)));

  res.json({
    status: "online",
    versao: "43.1",
    motor: "operacoes-green-loss-estatisticas",
    fonte: statusFonte,
    mesaId,
    mesa: getMesaNome(mesaId),
    mesas: CASINOSCORES_MESAS,
    mesasAtivas,
    mesaAtiva: mesaEstaAtiva(mesaId),
    estrategiasAtivas: normalizarConfiguracoes(strategyConfigs),
    sinal,
    operacao: op,
    ultimaOperacao: finalizada,
    estatisticas: estatisticasOperacoes(mesaId),
    ultimo: lista[0] || null,
    historico: lista.slice(0, 100),
    historicoCompleto: lista.slice(0, 500),
    total: lista.length,
    updatedAt: new Date().toISOString()
  });
});


app.get("/whatsapp/status", (req, res) => {
  res.json(statusWhatsApp());
});

app.get("/whatsapp/preview", (req, res) => {
  const mesaId = req.query.mesaId || "auto";
  const op = operacaoAtualPorMesa?.[mesaId] || null;
  const sinal = op ? formatarSinalDaOperacao(op) : (sinalAtualPorMesa?.[mesaId] || gerarSinal(mesaId));
  res.type("text/plain").send(montarTextoSinal(sinal, "https://go.aff.esportiva.bet/troj2nok"));
});

app.get("/status", (req, res) => {
  res.json({
    api: "online",
    projeto: "LS Roleta 42.1",
    motor: "operacoes-green-loss-estatisticas",
    fonte: statusFonte,
    mesas: CASINOSCORES_MESAS,
    mesasAtivas,
    totalHistorico: historico.length,
    estrategiasSalvas: strategyConfigs.length,
    estatisticas: estatisticasOperacoes(),
    ultimo: historico[0] || null
  });
});

app.get("/", (req, res) => {
  res.json({
    status: "online",
    projeto: "LS Roleta",
    versao: "43.1 Mobile Premium Mesas Ativas",
    mensagem: "API funcionando com interface profissional",
    rotas: ["/resultado", "/resultados", "/sinal", "/status", "/mesas", "/mesas-ativas", "/estrategias", "/operacoes", "/whatsapp/status", "/whatsapp/preview"]
  });
});

function corNumero(n) {
  if (n === 0) return "verde";
  return VERMELHOS.includes(n) ? "vermelho" : "preto";
}

function duziaNumero(n) {
  if (n === 0) return "zero";
  if (n <= 12) return "1ª dúzia";
  if (n <= 24) return "2ª dúzia";
  return "3ª dúzia";
}

function colunaNumero(n) {
  if (n === 0) return "zero";
  if (n % 3 === 1) return "1ª coluna";
  if (n % 3 === 2) return "2ª coluna";
  return "3ª coluna";
}

function altoBaixoNumero(n) {
  if (n === 0) return "zero";
  return n <= 18 ? "baixo" : "alto";
}

iniciarCasinoScores({
  onResultado: ({ numero, fonte, mesa, mesaId, horarioOriginal, topic, stats }) => {
    registrarNumero(numero, { fonte, mesa, mesaId, horarioOriginal, topic, stats });
  },
  onStatus: (status) => {
    statusFonte = status;
  }
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`✅ API LS Roleta 43.1 rodando na porta ${PORT}`);
});
