// LS Roleta - Integração WhatsApp pela Evolution API

const EVOLUTION_URL = process.env.EVOLUTION_URL || "http://localhost:8080";
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || "ls-roleta-bot2";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "";
const WHATSAPP_DESTINO = process.env.WHATSAPP_DESTINO || "";
const LINK_MESA =
  process.env.LINK_MESA || "https://go.aff.esportiva.bet/troj2nok";

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
    provedor: "Evolution API"
  };
}

export function montarTextoSinal(sinal, link = LINK_MESA) {
  if (!sinal) return "LS Roleta: sem sinal no momento.";

  return [
    sinal.finalizado ? `✅ ${sinal.status}` : "🚨 NOVA ENTRADA",
    "",
    `🎰 Mesa: ${sinal.mesa || "-"}`,
    `🎯 Entrada: ${sinal.entradaFormatada || sinal.entrada || "-"}`,
    `🟢 Cobertura: ${sinal.cobertura || "ZERO"}`,
    `🛡️ Progressão: ${sinal.progressao || "Até Gale 2"}`,
    `📊 Confiança: ${sinal.confianca || "-"}`,
    `📌 Estratégia: ${sinal.estrategia || "-"}`,
    sinal.motivo ? `🧠 Motivo: ${sinal.motivo}` : "",
    link ? `\n🔗 Abrir mesa:\n${link}` : "",
    "",
    "LS Roleta"
  ]
    .filter(Boolean)
    .join("\n");
}

export async function enviarMensagemWhatsApp(destino, texto) {
  if (!EVOLUTION_API_KEY) {
    return { ok: false, erro: "EVOLUTION_API_KEY não configurada" };
  }

  if (!destino) {
    return { ok: false, erro: "WHATSAPP_DESTINO não configurado" };
  }

  try {
    const numero = String(destino).replace(/\D/g, "");

    const resposta = await fetch(
      `${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
      {
        method: "POST",
        headers: {
          apikey: EVOLUTION_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          number: numero,
          text: texto
        })
      }
    );

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      console.error("❌ Erro Evolution API:", dados);
      return {
        ok: false,
        status: resposta.status,
        erro: dados
      };
    }

    console.log("✅ WhatsApp enviado:", dados?.key?.id || "mensagem aceita");
    return { ok: true, dados };
  } catch (erro) {
    console.error("❌ Falha ao enviar WhatsApp:", erro.message);
    return { ok: false, erro: erro.message };
  }
}

export async function enviarSinalWhatsApp(sinal) {
  const texto = montarTextoSinal(sinal, LINK_MESA);
  return enviarMensagemWhatsApp(WHATSAPP_DESTINO, texto);
}
