const exemplos = [2, 4, 14, 17, 29, 18, 16, 1, 10, 31, 7, 23, 35, 12, 0, 9, 21, 5, 28, 33];

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const agora = Date.now();
  const historico = exemplos.map((numero, index) => ({
    numero,
    createdAt: new Date(agora - index * 45000).toISOString()
  }));

  return res.status(200).json({
    online: true,
    historico,
    numeros: historico.map((item) => item.numero),
    updatedAt: new Date().toISOString()
  });
}
