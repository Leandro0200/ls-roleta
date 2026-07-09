const VERMELHOS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

function corNumero(n) {
  if (n === 0) return "verde";
  return VERMELHOS.includes(n) ? "vermelho" : "preto";
}

function paridadeNumero(n) {
  if (n === 0) return "zero";
  return n % 2 === 0 ? "par" : "impar";
}

function altoBaixoNumero(n) {
  if (n === 0) return "zero";
  return n <= 18 ? "baixo" : "alto";
}

function duziaNumero(n) {
  if (n === 0) return 0;
  if (n <= 12) return 1;
  if (n <= 24) return 2;
  return 3;
}

function colunaNumero(n) {
  if (n === 0) return 0;
  if ([1,4,7,10,13,16,19,22,25,28,31,34].includes(n)) return 1;
  if ([2,5,8,11,14,17,20,23,26,29,32,35].includes(n)) return 2;
  return 3;
}

function contarSequencia(lista, valor) {
  let total = 0;
  for (const item of lista) {
    if (item === valor) total++;
    else break;
  }
  return total;
}

function candidato(entradaCurta, estrategia, confianca, motivo, categoria) {
  return {
    entrada: `ENTRAR EM ${entradaCurta}`,
    entradaCurta,
    cobertura: "0️⃣ ZERO",
    protecao: "Sem gale automático",
    estrategia,
    confianca,
    motivo,
    categoria,
    confirmacoes: 1,
    status: "aberto"
  };
}

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const query = req.query?.numeros;
  const numeros = String(query || "2,4,14,17,29,18,16,1,10,31")
    .split(",")
    .map((n) => Number(n.trim()))
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 36);

  const candidatos = [];

  const cores = numeros.map(corNumero);
  const paridades = numeros.map(paridadeNumero);
  const altoBaixo = numeros.map(altoBaixoNumero);
  const duzias = numeros.map(duziaNumero);
  const colunas = numeros.map(colunaNumero);

  const corAtual = cores[0];
  const seqCor = contarSequencia(cores, corAtual);
  if (corAtual !== "verde" && seqCor >= 3) {
    candidatos.push(candidato(
      corAtual === "vermelho" ? "PRETO" : "VERMELHO",
      "Sequência de Cor",
      Math.min(96, 82 + (seqCor - 3) * 6),
      `${seqCor}x ${corAtual} seguido.`,
      "cor"
    ));
  }

  const parAtual = paridades[0];
  const seqPar = contarSequencia(paridades, parAtual);
  if (parAtual !== "zero" && seqPar >= 3) {
    candidatos.push(candidato(
      parAtual === "par" ? "ÍMPAR" : "PAR",
      "Par / Ímpar",
      Math.min(92, 78 + (seqPar - 3) * 6),
      `${seqPar}x ${parAtual} seguido.`,
      "paridade"
    ));
  }

  const abAtual = altoBaixo[0];
  const seqAb = contarSequencia(altoBaixo, abAtual);
  if (abAtual !== "zero" && seqAb >= 4) {
    candidatos.push(candidato(
      abAtual === "baixo" ? "ALTO" : "BAIXO",
      "Alto / Baixo",
      Math.min(92, 78 + (seqAb - 4) * 6),
      `${seqAb}x ${abAtual} seguido.`,
      "altoBaixo"
    ));
  }

  const duziaAtual = duzias[0];
  const seqDuzia = contarSequencia(duzias, duziaAtual);
  if (duziaAtual !== 0 && seqDuzia >= 3) {
    const entradas = [1,2,3].filter((d) => d !== duziaAtual);
    candidatos.push(candidato(
      `${entradas[0]}ª + ${entradas[1]}ª DÚZIA`,
      "Dúzias",
      Math.min(94, 80 + (seqDuzia - 3) * 6),
      `${seqDuzia}x ${duziaAtual}ª dúzia seguida.`,
      "duzia"
    ));
  }

  const colunaAtual = colunas[0];
  const seqColuna = contarSequencia(colunas, colunaAtual);
  if (colunaAtual !== 0 && seqColuna >= 3) {
    const entradas = [1,2,3].filter((c) => c !== colunaAtual);
    candidatos.push(candidato(
      `COLUNA ${entradas[0]} + COLUNA ${entradas[1]}`,
      "Colunas",
      Math.min(94, 80 + (seqColuna - 3) * 6),
      `${seqColuna}x coluna ${colunaAtual} seguida.`,
      "coluna"
    ));
  }

  if (!candidatos.length) {
    return res.status(200).json({
      online: true,
      sinal: {
        entrada: null,
        entradaCurta: null,
        cobertura: "0️⃣ ZERO",
        protecao: "Sem sinal",
        estrategia: "Aguardando",
        confianca: 0,
        motivo: "Nenhuma estratégia confirmou entrada.",
        status: "aguardando"
      },
      numeros,
      updatedAt: new Date().toISOString()
    });
  }

  candidatos.sort((a, b) => b.confianca - a.confianca);
  const sinal = candidatos[0];

  return res.status(200).json({
    online: true,
    sinal,
    candidatos,
    numeros,
    updatedAt: new Date().toISOString()
  });
}
