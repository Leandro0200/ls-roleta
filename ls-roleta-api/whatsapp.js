// LS Roleta 44.1 - Bot profissional controlado pelo painel

const EVOLUTION_URL = process.env.EVOLUTION_URL || "http://localhost:8080";
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || "ls-roleta-bot2";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "";
const WHATSAPP_DESTINO = process.env.WHATSAPP_DESTINO || "";
const LINK_MESA = process.env.LINK_MESA || "https://go.aff.esportiva.bet/troj2nok";
const NOME_BOT = process.env.NOME_BOT || "LS Roleta Premium";

const enviadosRecentes = new Map();
const JANELA_DEDUP_MS = 15000;

function numeroLimpo(destino) {
  return String(destino || "").replace(/\D/g, "");
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
    nomeBot: NOME_BOT
  };
}

function cabecalhoPorStatus(sinal) {
  const status = String(sinal?.statusOperacao || "").toLowerCase();

  if (status === "gale_1") return "🟡 *GALE 1 — MANTER ENTRADA*";
  if (status === "gale_2") return "🟠 *GALE 2 — ÚLTIMA PROTEÇÃO*";
  if (status === "green") return "✅ *GREEN CONFIRMADO*";
  if (status === "green_zero") return "🟢 *GREEN NO ZERO*";
  if (status === "loss") return "🔴 *LOSS ENCERRADO*";

  return "🚨 *NOVA ENTRADA CONFIRMADA*";
}

export function montarTextoSinal(sinal, link = LINK_MESA) {
  if (!sinal) return `${NOME_BOT}: sem sinal no momento.`;

  const status = String(sinal.statusOperacao || "").toLowerCase();
  const encerrado = ["green", "green_zero", "loss"].includes(status);

  return [
    cabecalhoPorStatus(sinal),
    "",
    `🎰 *Mesa:* ${sinal.mesa || "-"}`,
    !encerrado ? `🎯 *Entrada:* ${sinal.entradaFormatada || sinal.entrada || "-"}` : "",
    `🟢 *Cobertura:* ${sinal.cobertura || "ZERO"}`,
    status.startsWith("gale_")
      ? `🛡️ *Progressão atual:* Gale ${sinal.galeAtual || status.split("_")[1]}`
      : `🛡️ *Progressão:* ${sinal.progressao || "Até Gale 2"}`,
    `📊 *Confiança:* ${sinal.confianca || "-"}`,
    sinal.estrategia ? `📌 *Estratégia:* ${sinal.estrategia}` : "",
    sinal.motivo && !encerrado ? `🧠 *Leitura:* ${sinal.motivo}` : "",
    sinal.resultadoFinal?.numero !== undefined ? `🎲 *Resultado:* ${sinal.resultadoFinal.numero}` : "",
    sinal.resultadoFinal?.status ? `📈 *Fechamento:* ${sinal.resultadoFinal.status}` : "",
    link && !encerrado ? `\n🔗 *Acessar mesa:*\n${link}` : "",
    "",
    `🤖 _${NOME_BOT}_`
  ].filter(Boolean).join("\n");
}

export async function enviarMensagemWhatsApp(destino, texto) {
  if (!EVOLUTION_API_KEY) {
    return { ok: false, erro: "EVOLUTION_API_KEY não configurada" };
  }

  const numero = numeroLimpo(destino);
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
