// LS Roleta 45.1 - Mensagens Premium + placar diário

const EVOLUTION_URL = process.env.EVOLUTION_URL || "http://localhost:8080";
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || "ls-roleta-bot2";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "";
const WHATSAPP_DESTINO = process.env.WHATSAPP_DESTINO || "";
const LINK_MESA = process.env.LINK_MESA || "https://go.aff.esportiva.bet/troj2nok";
const NOME_BOT = process.env.NOME_BOT || "LS Roleta Premium";

const enviadosRecentes = new Map();
const JANELA_DEDUP_MS = 15000;

function normalizarDestino(destino) {
  const valor = String(destino || "").trim();

  // Mantém IDs de grupos e outros JIDs do WhatsApp.
  if (valor.endsWith("@g.us") || valor.endsWith("@s.whatsapp.net")) {
    return valor;
  }

  return valor.replace(/\D/g, "");
}

function chaveMensagem(sinal, tipo) {
  return [
    sinal?.operacaoId || sinal?.id || "",
    sinal?.mesaId || sinal?.mesa || "",
    tipo || sinal?.statusOperacao || sinal?.status || "",
    sinal?.galeAtual ?? ""
  ].join("|");
}

function jaFoiEnviado(chave) {
  const agora = Date.now();

  for (const [item, horario] of enviadosRecentes.entries()) {
    if (agora - horario > JANELA_DEDUP_MS) enviadosRecentes.delete(item);
  }

  if (enviadosRecentes.has(chave)) return true;
  enviadosRecentes.set(chave, agora);
  return false;
}

export function statusWhatsApp() {
  return {
    configurado: Boolean(
      EVOLUTION_URL &&
      EVOLUTION_INSTANCE &&
      EVOLUTION_API_KEY &&
      WHATSAPP_DESTINO
    ),
    instancia: EVOLUTION_INSTANCE,
    destinoConfigurado: Boolean(WHATSAPP_DESTINO),
    provedor: "Evolution API",
    nomeBot: NOME_BOT,
    versao: "45.1"
  };
}

function textoPlacar(placar) {
  if (!placar) return "";

  return [
    "━━━━━━━━━━━━━━",
    "",
    "📊 *Placar da Sessão*",
    "",
    `✅ Greens: ${placar.greens ?? 0}`,
    `🔴 Losses: ${placar.losses ?? 0}`,
    `🎯 Assertividade: ${placar.assertividade || "0%"}`
  ].join("\n");
}

function tituloResultado(sinal) {
  const status = String(sinal?.statusOperacao || "").toLowerCase();
  const fechamento = String(sinal?.resultadoFinal?.status || sinal?.status || "").toUpperCase();
  const gale = Number(sinal?.resultadoFinal?.gale ?? sinal?.galeAtual ?? 0);

  if (status === "loss") return "🔴 *LOSS*";
  if (status === "green_zero") return "🍀 *GREEN ZERO* 🍀";
  if (fechamento.includes("G2") || gale === 2) return "🟠 *GREEN G2* 💚";
  if (fechamento.includes("G1") || gale === 1) return "🟡 *GREEN G1* 💚";
  return "✅ *GREEN DIRETO* 💚";
}

function fraseResultado(sinal) {
  const status = String(sinal?.statusOperacao || "").toLowerCase();
  const gale = Number(sinal?.resultadoFinal?.gale ?? sinal?.galeAtual ?? 0);

  if (status === "loss") return "📉 Operação encerrada.";
  if (status === "green_zero") return "💰 Cobertura no ZERO confirmada!";
  if (gale === 2) return "🏆 Green na 2ª proteção!";
  if (gale === 1) return "🏆 Green na 1ª proteção!";
  return "🏆 Operação encerrada com sucesso!";
}

function montarEntrada(sinal, link) {
  return [
    "🚨 *NOVA ENTRADA CONFIRMADA*",
    "",
    `🎰 Mesa: ${sinal.mesa || "-"}`,
    "",
    `🎯 Entrada: ${sinal.entradaFormatada || sinal.entrada || "-"}`,
    `🛡️ Proteção: ${sinal.progressao || "Até Gale 2"}`,
    `🟢 Cobertura: ${sinal.cobertura || "ZERO"}`,
    "",
    `🧠 Estratégia: ${sinal.estrategia || "-"}`,
    "",
    "📖 Padrão identificado:",
    sinal.motivo || "Padrão confirmado pelo motor de estratégias.",
    "",
    "━━━━━━━━━━━━━━",
    "",
    link ? `🔗 Acessar mesa:\n${link}` : "",
    "",
    `🤖 ${NOME_BOT}`
  ].filter(Boolean).join("\n");
}

function montarGale(sinal, link) {
  const gale = Number(sinal.galeAtual || 1);
  const titulo = gale >= 2
    ? "🟠 *GALE 2 — ÚLTIMA PROTEÇÃO*"
    : "🟡 *GALE 1 — MANTER A ENTRADA*";
  const aviso = gale >= 2
    ? "⚠️ Última proteção da operação."
    : "⚠️ Aguarde o próximo giro.";

  return [
    titulo,
    "",
    `🎰 Mesa: ${sinal.mesa || "-"}`,
    "",
    "🎯 Continuar em:",
    sinal.entradaFormatada || sinal.entrada || "-",
    "",
    `🛡️ Proteção: Gale ${gale}`,
    `🟢 Cobertura: ${sinal.cobertura || "ZERO"}`,
    "",
    "📖 Padrão identificado:",
    sinal.motivo || "Padrão confirmado pelo motor de estratégias.",
    "",
    "━━━━━━━━━━━━━━",
    "",
    aviso,
    link ? `\n🔗 Acessar mesa:\n${link}` : "",
    "",
    `🤖 ${NOME_BOT}`
  ].filter(Boolean).join("\n");
}

function montarResultado(sinal) {
  return [
    tituloResultado(sinal),
    "",
    `🎰 Mesa: ${sinal.mesa || "-"}`,
    `🎲 Resultado: ${sinal.resultadoFinal?.numero ?? "-"}`,
    "",
    fraseResultado(sinal),
    "",
    textoPlacar(sinal.placarDia),
    "",
    `🤖 ${NOME_BOT}`
  ].filter(Boolean).join("\n");
}

export function montarTextoSinal(sinal, link = LINK_MESA) {
  if (!sinal) return `${NOME_BOT}: sem sinal no momento.`;

  const status = String(sinal.statusOperacao || "").toLowerCase();

  if (status === "gale_1" || status === "gale_2") {
    return montarGale(sinal, link);
  }

  if (["green", "green_zero", "loss"].includes(status)) {
    return montarResultado(sinal);
  }

  return montarEntrada(sinal, link);
}

export async function enviarMensagemWhatsApp(destino, texto) {
  if (!EVOLUTION_API_KEY) {
    return { ok: false, erro: "EVOLUTION_API_KEY não configurada" };
  }

  const numero = normalizarDestino(destino);
  if (!numero) {
    return { ok: false, erro: "WHATSAPP_DESTINO não configurado" };
  }

  try {
    const resposta = await fetch(
      `${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
      {
        method: "POST",
        headers: {
          apikey: EVOLUTION_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ number: numero, text: texto })
      }
    );

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      console.error("❌ Evolution API:", dados);
      return { ok: false, status: resposta.status, erro: dados };
    }

    console.log("✅ WhatsApp enviado:", dados?.key?.id || "mensagem aceita");
    return { ok: true, dados };
  } catch (erro) {
    console.error("❌ Falha no WhatsApp:", erro.message);
    return { ok: false, erro: erro.message };
  }
}

async function enviarComDedupe(sinal, tipo) {
  const chave = chaveMensagem(sinal, tipo);

  if (jaFoiEnviado(chave)) {
    return { ok: true, ignorado: true, motivo: "duplicado" };
  }

  return enviarMensagemWhatsApp(
    WHATSAPP_DESTINO,
    montarTextoSinal(sinal, sinal?.linkPersonalizado || LINK_MESA)
  );
}

export async function enviarSinalWhatsApp(sinal, link = LINK_MESA) {
  return enviarComDedupe({ ...sinal, linkPersonalizado: link }, "entrada");
}

export async function enviarAtualizacaoWhatsApp(sinal, link = LINK_MESA) {
  return enviarComDedupe(
    { ...sinal, linkPersonalizado: link },
    sinal?.statusOperacao || sinal?.status || "atualizacao"
  );
}
