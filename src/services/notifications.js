export async function pedirPermissaoNotificacao() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const permissao = await Notification.requestPermission();
  return permissao === "granted";
}

export async function notificarNovoSinal(sinal) {
  const permitido = await pedirPermissaoNotificacao();
  if (!permitido || !sinal?.entradaCurta) return;

  new Notification("LS Roleta - Novo sinal", {
    body: `${sinal.entradaCurta} + cobertura no 0 | Confiança ${sinal.confianca || 0}%`,
    icon: "/icon-192.png",
    badge: "/icon-192.png"
  });
}
