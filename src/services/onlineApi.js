export async function getApiStatus() {
  const res = await fetch("/api/status", { cache: "no-store" });
  if (!res.ok) throw new Error("API offline");
  return res.json();
}

export async function getApiHistory() {
  const res = await fetch("/api/history", { cache: "no-store" });
  if (!res.ok) throw new Error("Histórico offline");
  return res.json();
}

export async function getApiSignal(numeros = []) {
  const query = numeros.length ? `?numeros=${numeros.join(",")}` : "";
  const res = await fetch(`/api/signal${query}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Sinal offline");
  return res.json();
}
