// LS Roleta 40.0 - WhatsApp grátis preparado via Baileys
// Para ativar: npm install @whiskeysockets/baileys qrcode-terminal
let sock = null;
let conectado = false;

export function statusWhatsApp() {
  return { conectado, pronto: Boolean(sock) };
}

export async function enviarMensagemWhatsApp(destino, texto) {
  if (!sock || !conectado) return { ok: false, erro: "WhatsApp não conectado" };
  const jid = String(destino).includes("@") ? destino : `${String(destino).replace(/\D/g, "")}@s.whatsapp.net`;
  await sock.sendMessage(jid, { text: texto });
  return { ok: true };
}

export function montarTextoSinal(sinal, link = "") {
  if (!sinal) return "LS Roleta: sem sinal no momento.";
  return [
    sinal.finalizado ? `✅ ${sinal.status}` : "🚨 NOVA ENTRADA",
    "",
    `🎰 Mesa: ${sinal.mesa || "-"}`,
    `🎯 Entrada: ${sinal.entrada || "-"}`,
    `🟢 Cobertura: ${sinal.cobertura || "ZERO"}`,
    `🛡️ Progressão: ${sinal.progressao || "Até Gale 2"}`,
    `📊 Confiança: ${sinal.confianca || "-"}`,
    `📌 Estratégia: ${sinal.estrategia || "-"}`,
    sinal.motivo ? `🧠 Motivo: ${sinal.motivo}` : "",
    link ? `\n🔗 Abrir mesa:\n${link}` : "",
    "",
    "LS Roleta"
  ].filter(Boolean).join("\n");
}
