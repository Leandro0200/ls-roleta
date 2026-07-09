const estrategias = [
  { nome: "Sequência de Cor", green: 18, red: 5 },
  { nome: "Colunas", green: 13, red: 4 },
  { nome: "Dúzias", green: 11, red: 5 },
  { nome: "Par / Ímpar", green: 9, red: 4 },
  { nome: "Alto / Baixo", green: 8, red: 3 }
];

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const ranking = estrategias.map((item) => {
    const total = item.green + item.red;
    return {
      ...item,
      total,
      assertividade: total ? Math.round((item.green / total) * 100) : 0
    };
  }).sort((a, b) => b.assertividade - a.assertividade);

  const green = ranking.reduce((s, i) => s + i.green, 0);
  const red = ranking.reduce((s, i) => s + i.red, 0);
  const total = green + red;

  return res.status(200).json({
    online: true,
    resumo: {
      green,
      red,
      total,
      assertividade: total ? Math.round((green / total) * 100) : 0,
      melhorEstrategia: ranking[0]?.nome || "Aguardando"
    },
    ranking,
    updatedAt: new Date().toISOString()
  });
}
