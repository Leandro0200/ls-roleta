export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  return res.status(200).json({
    online: true,
    configuracao: {
      coberturaZero: true,
      confirmacaoDupla: true,
      confiancaMinima: 80,
      atualizarACadaSegundos: 10,
      notificacoes: true
    },
    updatedAt: new Date().toISOString()
  });
}
