console.log("🎰 LS CAPTURA REFORÇADA");

const API_URL = "https://ls-roleta-production-89c6.up.railway.app/resultado";

let ativo = false;
let debuggees = [];
let ultimoNumero = null;
let ultimoTempo = 0;
let timerTargets = null;

chrome.action.onClicked.addListener((tab) => {
  if (!tab?.id) return;

  if (ativo) {
    desligar();
    return;
  }

  ativo = true;
  console.clear();
  console.log("🚀 Captura ligada");

  anexarTodos();

  timerTargets = setInterval(anexarTodos, 5000);
});

function anexarTodos() {
  chrome.debugger.getTargets((targets) => {
    targets.forEach((target) => {
      const debuggee = target.tabId
        ? { tabId: target.tabId }
        : { targetId: target.id };

      const jaExiste = debuggees.some(
        (d) => d.tabId === debuggee.tabId && d.targetId === debuggee.targetId
      );

      if (jaExiste) return;

      chrome.debugger.attach(debuggee, "1.3", () => {
        if (chrome.runtime.lastError) return;

        debuggees.push(debuggee);

        console.log("✅ Anexado:", target.type, target.url || target.title);

        chrome.debugger.sendCommand(debuggee, "Network.enable", {}, () => {});
      });
    });
  });
}

chrome.debugger.onEvent.addListener((source, method, params) => {
  if (!ativo) return;
  if (method !== "Network.webSocketFrameReceived") return;

  const texto = String(params.response?.payloadData || "");
  if (!texto) return;

  if (!texto.includes("roulette.winSpots")) return;

  console.log("🎰 FRAME ROLETA:");
  console.log(texto);

  const numero = extrairNumero(texto);
  if (numero === null) return;

  const agora = Date.now();

  if (ultimoNumero === numero && agora - ultimoTempo < 15000) return;

  ultimoNumero = numero;
  ultimoTempo = agora;

  console.log("🎯 RESULTADO DA ROLETA:", numero);

  enviarResultado(numero, texto, params.requestId);
});

function extrairNumero(texto) {
  try {
    const obj = JSON.parse(texto);

    if (obj.type !== "roulette.winSpots") return null;

    let numero = null;

    if (obj.args?.result?.[0]?.number !== undefined) {
      numero = Number(obj.args.result[0].number);
    } else if (obj.args?.code !== undefined) {
      numero = Number(obj.args.code);
    }

    if (Number.isNaN(numero)) return null;
    if (numero < 0 || numero > 36) return null;

    return numero;
  } catch (e) {
    console.error("Erro ao extrair número:", e);
    return null;
  }
}

async function enviarResultado(numero, raw, requestId) {
  try {
    const resposta = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        numero,
        raw,
        requestId,
        origem: "chrome-debugger-reforcado",
        horario: new Date().toISOString()
      })
    });

    const json = await resposta.json();

    console.log("📤 Enviado para API:", json);
  } catch (e) {
    console.error("❌ Erro API:", e);
  }
}

function desligar() {
  if (timerTargets) clearInterval(timerTargets);

  debuggees.forEach((d) => {
    chrome.debugger.detach(d, () => {});
  });

  debuggees = [];
  ativo = false;
  ultimoNumero = null;
  ultimoTempo = 0;

  console.log("🛑 Captura desligada");
}