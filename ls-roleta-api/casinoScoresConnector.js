import { Client } from "@stomp/stompjs";
import WebSocket from "ws";

export const CASINOSCORES_MESAS = [
  {
    id: "xxxtreme",
    nome: "XXXTreme Lightning Roulette",
    curto: "XXXTreme",
    icon: "⚡⚡⚡",
    topic: "/topic/stats/xxxtreme-lightning-roulette/72",
    ativa: true
  },
  {
    id: "lightning",
    nome: "Lightning Roulette",
    curto: "Lightning",
    icon: "⚡",
    topic: "/topic/stats/lightning-roulette/72",
    ativa: true
  },
  {
    id: "immersive",
    nome: "Immersive Roulette",
    curto: "Immersive",
    icon: "🎯",
    topic: "/topic/stats/immersive-roulette/72",
    ativa: true
  },
  {
    id: "auto",
    nome: "Auto Roulette",
    curto: "Auto",
    icon: "🤖",
    topic: "/topic/stats/auto-roulette/72",
    ativa: true
  },
  {
    id: "goldVault",
    nome: "Gold Vault Roulette",
    curto: "Gold Vault",
    icon: "🏆",
    topic: "/topic/stats/gold-vault-roulette/72",
    ativa: true
  },
  {
    id: "mega",
    nome: "Mega Roulette",
    curto: "Mega",
    icon: "💥",
    topic: "/topic/stats/mega-roulette/72",
    ativa: true
  },
  {
    id: "fortune",
    nome: "Fortune Roulette",
    curto: "Fortune",
    icon: "💰",
    topic: "/topic/stats/fortune-roulette/4320",
    ativa: true
  }
];

export function iniciarCasinoScores({ onResultado, onStatus }) {
  const ultimoPorMesa = new Map();
  const statusPorMesa = new Map();

  function atualizarStatus(mesaId, patch) {
    const atual = statusPorMesa.get(mesaId) || {};
    const novo = {
      ...atual,
      ...patch,
      atualizadoEm: new Date().toISOString()
    };
    statusPorMesa.set(mesaId, novo);

    onStatus?.({
      online: true,
      fonte: "CasinoScores",
      atualizadoEm: new Date().toISOString(),
      mesas: Object.fromEntries(statusPorMesa.entries())
    });
  }

  const client = new Client({
    brokerURL: "wss://live-api.casinoscores.com/ws",
    webSocketFactory: () => new WebSocket("wss://live-api.casinoscores.com/ws"),
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,

    onConnect: () => {
      console.log("✅ CasinoScores conectado");

      for (const mesa of CASINOSCORES_MESAS.filter((m) => m.ativa)) {
        atualizarStatus(mesa.id, {
          online: true,
          mesa: mesa.nome,
          topic: mesa.topic,
          ultimoNumero: null
        });

        client.subscribe(mesa.topic, (message) => {
          try {
            const data = JSON.parse(message.body);
            const ultimo = data.aggStatsRouletteNumbers?.find((n) => n.lastSeenBefore === 0);

            if (!ultimo) return;

            const chave = `${mesa.id}:${ultimo.number}:${ultimo.lastOccurredAt}`;

            if (ultimoPorMesa.get(mesa.id) === chave) return;
            ultimoPorMesa.set(mesa.id, chave);

            const resultado = {
              numero: Number(ultimo.number),
              corOriginal: ultimo.color,
              fonte: "CasinoScores",
              mesaId: mesa.id,
              mesa: mesa.nome,
              topic: mesa.topic,
              horarioOriginal: ultimo.lastOccurredAt,
              stats: {
                totalCount: data.totalCount,
                totalBonusRounds: data.totalBonusRounds,
                colorStats: data.colorStats,
                oddEvenStats: data.oddEvenStats,
                matchNoMatch: data.matchNoMatch,
                bestMultipliers: data.bestMultipliers?.slice?.(0, 5) || [],
                goldBarsAvg: data.goldBarsAvg || null,
                optimalRound: data.optimalRound || null,
                winTypesAggStats: data.winTypesAggStats || null
              }
            };

            atualizarStatus(mesa.id, {
              online: true,
              ultimoNumero: resultado.numero,
              ultimoHorario: resultado.horarioOriginal,
              mesa: mesa.nome,
              topic: mesa.topic
            });

            console.log(`🎯 ${mesa.nome}:`, resultado.numero, resultado.corOriginal);
            onResultado?.(resultado);
          } catch (err) {
            console.error(`Erro CasinoScores ${mesa.nome}:`, err.message);
          }
        });

        console.log("📡 Assinando mesa:", mesa.nome, mesa.topic);
      }

      onStatus?.({
        online: true,
        fonte: "CasinoScores",
        atualizadoEm: new Date().toISOString(),
        mesas: Object.fromEntries(statusPorMesa.entries())
      });
    },

    onDisconnect: () => {
      onStatus?.({
        online: false,
        fonte: "CasinoScores",
        atualizadoEm: new Date().toISOString(),
        mesas: Object.fromEntries(statusPorMesa.entries())
      });
    },

    onWebSocketClose: () => {
      console.log("⚠️ CasinoScores desconectado, tentando reconectar...");
      onStatus?.({
        online: false,
        fonte: "CasinoScores",
        atualizadoEm: new Date().toISOString(),
        mesas: Object.fromEntries(statusPorMesa.entries())
      });
    },

    onStompError: (frame) => {
      console.error("Erro STOMP:", frame.headers?.message || "erro desconhecido");
    }
  });

  client.activate();
  return client;
}
