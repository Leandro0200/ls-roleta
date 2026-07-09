const VERMELHOS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

export const estrategiaPadrao = {
  sequenciaCor: {
    nome: "Sequência de cor",
    ativa: true,
    minimo: 3,
    gale: 2,
    confianca: 82,
    tipo: "cor",
    descricao: "Se repetir vermelho/preto, entra na cor contrária."
  },

  parImpar: {
    nome: "Par / Ímpar",
    ativa: true,
    minimo: 3,
    gale: 2,
    confianca: 78,
    tipo: "paridade",
    descricao: "Se repetir par/ímpar, entra no contrário."
  },

  altoBaixo: {
    nome: "Alto / Baixo",
    ativa: true,
    minimo: 4,
    gale: 2,
    confianca: 78,
    tipo: "altoBaixo",
    descricao: "Se repetir baixo/alto, entra no contrário."
  },

  duzias: {
    nome: "Dúzias",
    ativa: true,
    minimo: 3,
    gale: 2,
    confianca: 80,
    tipo: "duzia",
    descricao: "Se repetir uma dúzia, entra nas outras duas."
  },

  colunas: {
    nome: "Colunas",
    ativa: true,
    minimo: 3,
    gale: 2,
    confianca: 80,
    tipo: "coluna",
    descricao: "Se repetir uma coluna, entra nas outras duas."
  },

  alternancia: {
    nome: "Alternância",
    ativa: true,
    minimo: 5,
    gale: 1,
    confianca: 74,
    tipo: "alternancia",
    descricao: "Detecta padrão alternado e sugere a continuidade."
  },

  repeticaoVizinhos: {
    nome: "Repetição / Vizinhos",
    ativa: false,
    minimo: 2,
    gale: 1,
    confianca: 70,
    tipo: "vizinhos",
    descricao: "Detecta números ou setores próximos repetindo."
  },

  atrasados: {
    nome: "Atrasados",
    ativa: false,
    minimo: 12,
    gale: 1,
    confianca: 68,
    tipo: "atrasados",
    descricao: "Detecta cor, dúzia ou coluna muito atrasada."
  },

  tendencia: {
    nome: "Tendência",
    ativa: false,
    minimo: 20,
    gale: 1,
    confianca: 72,
    tipo: "tendencia",
    descricao: "Analisa maioria nos últimos giros."
  },

  confirmacaoDupla: {
    nome: "Confirmação dupla",
    ativa: true,
    minimo: 2,
    gale: 2,
    confianca: 88,
    tipo: "confirmacao",
    descricao: "Só libera sinal forte quando 2 estratégias confirmam."
  }
};

export function carregarEstrategias() {
  try {
    const salvas = localStorage.getItem("ls_roleta_estrategias");
    if (!salvas) return estrategiaPadrao;

    const parsed = JSON.parse(salvas);
    return mesclarEstrategias(estrategiaPadrao, parsed);
  } catch {
    return estrategiaPadrao;
  }
}

export function salvarEstrategias(estrategias) {
  localStorage.setItem("ls_roleta_estrategias", JSON.stringify(estrategias));
}

export function avaliarEstrategias(historico = [], estrategias = estrategiaPadrao) {
  const numeros = normalizarHistorico(historico);

  if (numeros.length < 3) {
    return respostaSemSinal("Histórico insuficiente.");
  }

  const candidatos = [];

  const cor = numeros.map(corNumero);
  const paridade = numeros.map(paridadeNumero);
  const altoBaixo = numeros.map(altoBaixoNumero);
  const duzias = numeros.map(duziaNumero);
  const colunas = numeros.map(colunaNumero);

  if (estrategias.sequenciaCor?.ativa) {
    const item = estrategias.sequenciaCor;
    const atual = cor[0];
    const seq = contarSequencia(cor, atual);

    if (atual !== "verde" && seq >= Number(item.minimo || 3)) {
      candidatos.push(criarCandidato({
        entrada: atual === "vermelho" ? "VERMELHO NÃO — ENTRAR NO PRETO" : "PRETO NÃO — ENTRAR NO VERMELHO",
        entradaCurta: atual === "vermelho" ? "PRETO" : "VERMELHO",
        categoria: "cor",
        estrategia: item.nome,
        confianca: calcularConfianca(item.confianca, seq, item.minimo),
        protecao: `Gale ${item.gale}`,
        motivo: `${seq}x ${atual} seguido.`
      }));
    }
  }

  if (estrategias.parImpar?.ativa) {
    const item = estrategias.parImpar;
    const atual = paridade[0];
    const seq = contarSequencia(paridade, atual);

    if (atual !== "zero" && seq >= Number(item.minimo || 3)) {
      candidatos.push(criarCandidato({
        entrada: atual === "par" ? "ENTRAR NO ÍMPAR" : "ENTRAR NO PAR",
        entradaCurta: atual === "par" ? "ÍMPAR" : "PAR",
        categoria: "paridade",
        estrategia: item.nome,
        confianca: calcularConfianca(item.confianca, seq, item.minimo),
        protecao: `Gale ${item.gale}`,
        motivo: `${seq}x ${atual} seguido.`
      }));
    }
  }

  if (estrategias.altoBaixo?.ativa) {
    const item = estrategias.altoBaixo;
    const atual = altoBaixo[0];
    const seq = contarSequencia(altoBaixo, atual);

    if (atual !== "zero" && seq >= Number(item.minimo || 4)) {
      candidatos.push(criarCandidato({
        entrada: atual === "baixo" ? "ENTRAR NO ALTO" : "ENTRAR NO BAIXO",
        entradaCurta: atual === "baixo" ? "ALTO" : "BAIXO",
        categoria: "altoBaixo",
        estrategia: item.nome,
        confianca: calcularConfianca(item.confianca, seq, item.minimo),
        protecao: `Gale ${item.gale}`,
        motivo: `${seq}x ${atual} seguido.`
      }));
    }
  }

  if (estrategias.duzias?.ativa) {
    const item = estrategias.duzias;
    const atual = duzias[0];
    const seq = contarSequencia(duzias, atual);

    if (atual !== 0 && seq >= Number(item.minimo || 3)) {
      const entradas = [1, 2, 3].filter((d) => d !== atual);
      candidatos.push(criarCandidato({
        entrada: `ENTRAR NA ${entradas[0]}ª E ${entradas[1]}ª DÚZIA`,
        entradaCurta: `${entradas[0]}ª + ${entradas[1]}ª DÚZIA`,
        categoria: "duzia",
        estrategia: item.nome,
        confianca: calcularConfianca(item.confianca, seq, item.minimo),
        protecao: `Gale ${item.gale}`,
        motivo: `${seq}x ${atual}ª dúzia seguida.`
      }));
    }
  }

  if (estrategias.colunas?.ativa) {
    const item = estrategias.colunas;
    const atual = colunas[0];
    const seq = contarSequencia(colunas, atual);

    if (atual !== 0 && seq >= Number(item.minimo || 3)) {
      const entradas = [1, 2, 3].filter((c) => c !== atual);
      candidatos.push(criarCandidato({
        entrada: `ENTRAR NA COLUNA ${entradas[0]} E COLUNA ${entradas[1]}`,
        entradaCurta: `C${entradas[0]} + C${entradas[1]}`,
        categoria: "coluna",
        estrategia: item.nome,
        confianca: calcularConfianca(item.confianca, seq, item.minimo),
        protecao: `Gale ${item.gale}`,
        motivo: `${seq}x coluna ${atual} seguida.`
      }));
    }
  }

  if (estrategias.alternancia?.ativa) {
    const item = estrategias.alternancia;
    const base = cor.slice(0, Number(item.minimo || 5));

    if (detectarAlternancia(base)) {
      const proxima = base[0] === "vermelho" ? "PRETO" : "VERMELHO";
      candidatos.push(criarCandidato({
        entrada: `SEGUIR ALTERNÂNCIA — ENTRAR NO ${proxima}`,
        entradaCurta: proxima,
        categoria: "cor",
        estrategia: item.nome,
        confianca: Number(item.confianca || 74),
        protecao: `Gale ${item.gale}`,
        motivo: "Alternância vermelho/preto detectada."
      }));
    }
  }

  if (estrategias.tendencia?.ativa) {
    const item = estrategias.tendencia;
    const qtd = Number(item.minimo || 20);
    const ultimos = cor.slice(0, qtd).filter((c) => c !== "verde");

    if (ultimos.length >= Math.min(10, qtd)) {
      const vermelhos = ultimos.filter((c) => c === "vermelho").length;
      const pretos = ultimos.filter((c) => c === "preto").length;
      const total = vermelhos + pretos;

      if (total && Math.max(vermelhos, pretos) / total >= 0.7) {
        const dominante = vermelhos > pretos ? "VERMELHO" : "PRETO";
        candidatos.push(criarCandidato({
          entrada: `SEGUIR TENDÊNCIA — ${dominante}`,
          entradaCurta: dominante,
          categoria: "cor",
          estrategia: item.nome,
          confianca: Number(item.confianca || 72),
          protecao: `Gale ${item.gale}`,
          motivo: `${dominante} dominou ${Math.round((Math.max(vermelhos, pretos) / total) * 100)}% dos últimos ${total} giros.`
        }));
      }
    }
  }

  if (!candidatos.length) {
    return {
      ...respostaSemSinal("Nenhuma estratégia ativa confirmou entrada."),
      candidatos: []
    };
  }

  const agrupados = agruparConfirmacoes(candidatos);
  const melhorGrupo = agrupados[0];

  const confirmacaoAtiva = estrategias.confirmacaoDupla?.ativa;
  const minimoConfirmacao = Number(estrategias.confirmacaoDupla?.minimo || 2);

  if (confirmacaoAtiva && melhorGrupo.confirmacoes < minimoConfirmacao) {
    return {
      entrada: null,
      entradaCurta: null,
      estrategia: "Aguardando confirmação dupla",
      confianca: Math.max(...candidatos.map((c) => c.confianca)),
      protecao: "Sem entrada",
      motivo: "Existe sinal parcial, mas falta segunda confirmação.",
      candidatos
    };
  }

  const principal = melhorGrupo.itens.sort((a, b) => b.confianca - a.confianca)[0];
  const bonusConfirmacao = confirmacaoAtiva ? 8 + (melhorGrupo.confirmacoes - 2) * 4 : 0;

  return {
    ...principal,
    confianca: Math.min(98, principal.confianca + bonusConfirmacao),
    estrategia: melhorGrupo.itens.map((i) => i.estrategia).join(" + "),
    motivo: melhorGrupo.itens.map((i) => i.motivo).join(" | "),
    confirmacoes: melhorGrupo.confirmacoes,
    candidatos
  };
}

function normalizarHistorico(historico) {
  return historico
    .map((item) => {
      if (typeof item === "number") return item;
      if (typeof item === "string") return Number(item);
      return Number(item?.numero ?? item?.number ?? item?.resultado);
    })
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 36);
}

function criarCandidato(data) {
  return {
    entrada: data.entrada,
    entradaCurta: data.entradaCurta,
    categoria: data.categoria,
    estrategia: data.estrategia,
    confianca: Number(data.confianca || 0),
    protecao: data.protecao || "Gale 2",
    cobertura: "0️⃣ ZERO",
    motivo: data.motivo || ""
  };
}

function respostaSemSinal(motivo) {
  return {
    entrada: null,
    entradaCurta: null,
    estrategia: "Aguardando",
    confianca: 0,
    protecao: "Sem sinal",
    cobertura: "0️⃣ ZERO",
    motivo
  };
}

function contarSequencia(lista, valor) {
  let total = 0;
  for (const item of lista) {
    if (item === valor) total += 1;
    else break;
  }
  return total;
}

function calcularConfianca(base, seq, minimo) {
  const extra = Math.max(0, Number(seq) - Number(minimo || 3)) * 6;
  return Math.min(96, Number(base || 75) + extra);
}

function detectarAlternancia(lista) {
  if (lista.length < 5 || lista.includes("verde")) return false;

  for (let i = 1; i < lista.length; i++) {
    if (lista[i] === lista[i - 1]) return false;
  }

  return true;
}

function agruparConfirmacoes(candidatos) {
  const grupos = new Map();

  for (const item of candidatos) {
    const chave = item.categoria + "::" + item.entradaCurta;

    if (!grupos.has(chave)) {
      grupos.set(chave, []);
    }

    grupos.get(chave).push(item);
  }

  return [...grupos.values()]
    .map((itens) => ({
      itens,
      confirmacoes: itens.length,
      confianca: Math.max(...itens.map((i) => i.confianca))
    }))
    .sort((a, b) => {
      if (b.confirmacoes !== a.confirmacoes) return b.confirmacoes - a.confirmacoes;
      return b.confianca - a.confianca;
    });
}

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
