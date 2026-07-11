import React, { useEffect, useMemo, useState } from "react";

const EVENTOS = [
  ["entrada", "🚨 Nova entrada"],
  ["gale1", "🟡 Gale 1"],
  ["gale2", "🟠 Gale 2"],
  ["green", "✅ Green"],
  ["greenZero", "🟢 Green Zero"],
  ["loss", "🔴 Loss"]
];

export default function PainelWhatsApp44({ api, mesas = [], strategies = [] }) {
  const [config, setConfig] = useState({
    enabled: true,
    eventos: {},
    mesas: {},
    estrategias: {},
    linksPorMesa: {}
  });
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setMsg("");
    fetch(`${api}/whatsapp/config?t=${Date.now()}`, { cache: "no-store" })
      .then(async r => {
        const d = await r.json();
        if (!r.ok) throw new Error(d?.erro || `HTTP ${r.status}`);
        return d;
      })
      .then(d => d?.config && setConfig(d.config))
      .catch((e) => setMsg(`Não foi possível carregar o WhatsApp: ${e.message}`));
  }, [api]);

  function patch(secao, chave, valor) {
    setConfig(c => ({
      ...c,
      [secao]: { ...(c[secao] || {}), [chave]: valor }
    }));
  }

  async function salvar() {
    setSalvando(true);
    setMsg("");
    try {
      const r = await fetch(`${api}/whatsapp/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config })
      });
      const d = await r.json();
      setMsg(r.ok ? "Configurações aplicadas no WhatsApp ✅" : (d.erro || "Erro ao salvar"));
    } catch {
      setMsg("Falha de conexão com a API.");
    } finally {
      setSalvando(false);
    }
  }

  return <main className="whats44">
    <div className="waHead">
      <div>
        <h2>WhatsApp 45.0</h2>
        <p>O que você alterar aqui passa a valer nos sinais enviados.</p>
      </div>
      <label className="waMaster">
        <input type="checkbox" checked={config.enabled !== false}
          onChange={e => setConfig(c => ({ ...c, enabled: e.target.checked }))}/>
        <span>{config.enabled !== false ? "ATIVO" : "DESLIGADO"}</span>
      </label>
    </div>

    <section className="waCard">
      <h3>Eventos enviados</h3>
      <div className="waGrid">
        {EVENTOS.map(([id, nome]) =>
          <label key={id}><input type="checkbox"
            checked={config.eventos?.[id] !== false}
            onChange={e => patch("eventos", id, e.target.checked)}/>
            <span>{nome}</span>
          </label>
        )}
      </div>
    </section>

    <section className="waCard">
      <h3>Mesas que enviam para o WhatsApp</h3>
      <div className="waList">
        {mesas.map(m => <div key={m.id} className="waRow">
          <span>{m.icon} {m.nome}</span>
          <label className="waSwitch"><input type="checkbox"
            checked={config.mesas?.[m.id] !== false}
            onChange={e => patch("mesas", m.id, e.target.checked)}/><i/></label>
        </div>)}
      </div>
    </section>

    <section className="waCard">
      <h3>Estratégias que enviam</h3>
      <div className="waList">
        {strategies.map(s => <div key={s.id} className="waRow">
          <span>{s.icon || "🧠"} {s.title || s.nome || s.id}</span>
          <label className="waSwitch"><input type="checkbox"
            checked={config.estrategias?.[s.id] !== false}
            onChange={e => patch("estrategias", s.id, e.target.checked)}/><i/></label>
        </div>)}
      </div>
    </section>

    <section className="waCard">
      <h3>Link por mesa</h3>
      {mesas.map(m => <label className="waLink" key={m.id}>
        <span>{m.icon} {m.curto || m.nome}</span>
        <input value={config.linksPorMesa?.[m.id] || ""}
          placeholder="Deixe vazio para usar o link padrão"
          onChange={e => patch("linksPorMesa", m.id, e.target.value)}/>
      </label>)}
    </section>

    <button className="waSave" disabled={salvando} onClick={salvar}>
      {salvando ? "SALVANDO..." : "SALVAR E APLICAR NO WHATSAPP"}
    </button>
    {msg && <p className="waMsg">{msg}</p>}
  </main>;
}

export const painelWhatsApp44Css = `
.whats44{padding-bottom:30px}.waHead{display:flex;align-items:center;justify-content:space-between;gap:14px}.waHead p{color:#8fa09f}.waMaster{background:#101b18;border:1px solid #234b3a;border-radius:15px;padding:12px}.waMaster input{margin-right:8px}.waCard{background:linear-gradient(180deg,#0c1518,#060a0c);border:1px solid #1f3037;border-radius:20px;padding:16px;margin:14px 0}.waCard h3{margin-top:0}.waGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.waGrid label,.waRow{background:#091014;border:1px solid #1b2a30;border-radius:13px;padding:12px}.waGrid input{margin-right:8px}.waList{display:grid;gap:9px}.waRow{display:flex;align-items:center;justify-content:space-between}.waSwitch input{display:none}.waSwitch i{display:block;width:45px;height:24px;background:#253238;border-radius:99px;position:relative}.waSwitch i:after{content:"";position:absolute;width:18px;height:18px;left:3px;top:3px;background:white;border-radius:50%;transition:.2s}.waSwitch input:checked+i{background:#36df58}.waSwitch input:checked+i:after{left:24px}.waLink{display:block;margin:11px 0}.waLink span{display:block;margin-bottom:5px;font-weight:800}.waLink input{width:100%;background:#071013;color:white;border:1px solid #24363c;border-radius:12px;padding:12px}.waSave{width:100%;border:0;border-radius:15px;padding:15px;background:#40e45d;color:#031006;font-weight:1000}.waMsg{text-align:center;color:#4bf36a;font-weight:800}
`;
