export async function buscarUltimosNumeros(apiUrl = "") {
  if (!apiUrl) return [];

  const resposta = await fetch(apiUrl, { cache: "no-store" });
  if (!resposta.ok) {
    throw new Error("Erro ao buscar números da API");
  }

  const data = await resposta.json();

  if (Array.isArray(data)) return data;
  if (Array.isArray(data.numeros)) return data.numeros;
  if (Array.isArray(data.historico)) return data.historico;
  if (Array.isArray(data.results)) return data.results;

  return [];
}
