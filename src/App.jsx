import React, { useEffect, useMemo, useState } from "react";

const DEFAULT_API = "http://localhost:4000";
const AFILIADO_URL = "https://go.aff.esportiva.bet/troj2nok";

const FALLBACK_MESAS = [
  { id: "auto", nome: "Auto Roulette", curto: "Auto", icon: "🤖", status: { online: true } },
  { id: "lightning", nome: "Lightning Roulette", curto: "Lightning", icon: "⚡", status: { online: true } },
  { id: "immersive", nome: "Immersive Roulette", curto: "Immersive", icon: "🎯", status: { online: true } },
  { id: "fortune", nome: "Fortune Roulette", curto: "Fortune", icon: "💰", status: { online: true } },
  { id: "goldVault", nome: "Gold Vault Roulette", curto: "Gold Vault", icon: "🏆", status: { online: true } },
  { id: "mega", nome: "Mega Roulette", curto: "Mega", icon: "💥", status: { online: true } },
  { id: "xxxtreme", nome: "XXXTreme Lightning Roulette", curto: "XXXTreme", icon: "⚡⚡⚡", status: { online: true } },
];

const MENU = [
  ["inicio","📡","Sinal"], ["mesas","🎰","Mesas"], ["estrategias","🧠","Estratégias"],
  ["historico","📊","Histórico"], ["config","⚙️","Config."], ["suporte","🎧","Suporte"]
];

const DEFAULT_STRATEGIES = [
  { id:"cores", title:"Tendência de Cor", desc:"Entra na cor oposta após sequência.", icon:"🎯", active:true, min:4, gale:2, conf:72, coverZero:true },
  { id:"paridade", title:"Par / Ímpar", desc:"Sequência de pares ou ímpares.", icon:"P/I", active:true, min:3, gale:2, conf:70, coverZero:true },
  { id:"duzias", title:"Padrão de Dúzias", desc:"3 dúzias iguais → entra nas outras 2.", icon:"123", active:true, min:3, gale:2, conf:72, coverZero:true },
  { id:"colunas", title:"Padrão de Colunas", desc:"Entrada por repetição ou ausência de colunas.", icon:"|||", active:true, min:3, gale:2, conf:70, coverZero:true },
  { id:"alto-baixo", title:"Tendência de Altos/Baixos", desc:"Baixos ou altos consecutivos.", icon:"↕", active:true, min:4, gale:2, conf:72, coverZero:true },
  { id:"alternancia", title:"Alternância", desc:"Padrão de alternância de cores.", icon:"🔁", active:false, min:4, gale:1, conf:70, coverZero:true },
  { id:"repeticao", title:"Repetição / Vizinhos", desc:"Entra no número ou vizinho do último.", icon:"🎲", active:false, min:2, gale:2, conf:65, coverZero:true },
  { id:"atrasados", title:"Atrasados", desc:"Entra no padrão mais atrasado.", icon:"🏆", active:false, min:5, gale:1, conf:68, coverZero:true },
  { id:"confirmacao", title:"Confirmação Dupla", desc:"Confirma com 2 padrões antes de entrar.", icon:"✅", active:true, min:2, gale:1, conf:75, coverZero:true },
];

const LINKS = { auto:AFILIADO_URL, lightning:AFILIADO_URL, immersive:AFILIADO_URL, fortune:AFILIADO_URL, goldVault:AFILIADO_URL, mega:AFILIADO_URL, xxxtreme:AFILIADO_URL };

function loadStrategies(){
  try{
    const local = JSON.parse(localStorage.getItem("ls_strategy_configs_v257") || "null");
    if(Array.isArray(local)) return local.map(s => ({...DEFAULT_STRATEGIES.find(d=>d.id===s.id), ...s}));
  }catch{}
  return DEFAULT_STRATEGIES;
}

function color(c){ return c==="vermelho"?"red":c==="preto"?"black":c==="verde"?"green":""; }

function label(s){
  const op=s?.statusOperacao;
  if(op==="green") return "✅ GREEN";
  if(op==="green_zero") return "🟢 GREEN ZERO";
  if(op==="loss") return "❌ LOSS";
  if(op?.includes("gale")) return `🟡 ${s.status || "GALE"}`;
  if(s?.ativo) return "🚨 NOVA ENTRADA";
  return "AGUARDANDO SINAL";
}

export default function App(){
  const [page,setPage]=useState("inicio");
  const [api,setApi]=useState(localStorage.getItem("ls_api_url") || DEFAULT_API);
  const [mesaId,setMesaId]=useState(localStorage.getItem("ls_mesa") || "auto");
  const [data,setData]=useState(null);
  const [mesas,setMesas]=useState([]);
  const [ops,setOps]=useState({estatisticas:{},operacoes:[]});
  const [strategies,setStrategies]=useState(loadStrategies());
  const [mesasAtivas,setMesasAtivas]=useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ls_mesas_ativas") || "null") || {
        auto:true, lightning:true, immersive:true, fortune:true, goldVault:true, mega:true, xxxtreme:true
      };
    } catch {
      return { auto:true, lightning:true, immersive:true, fortune:true, goldVault:true, mega:true, xxxtreme:true };
    }
  });

  async function refresh(){
    try{
      const [s,m,o]=await Promise.all([
        fetch(`${api}/sinal?mesaId=${mesaId}`,{cache:"no-store"}),
        fetch(`${api}/mesas`,{cache:"no-store"}),
        fetch(`${api}/operacoes?mesaId=${mesaId}&limit=80`,{cache:"no-store"}).catch(()=>null)
      ]);
      if(s.ok) setData(await s.json());
      if(m.ok) setMesas(await m.json());
      if(o&&o.ok) setOps(await o.json());
    }catch(e){ console.warn(e.message); }
  }

  useEffect(()=>{ localStorage.setItem("ls_mesa",mesaId); refresh(); const t=setInterval(refresh,1300); return()=>clearInterval(t); },[mesaId,api]);

  useEffect(()=>{
    localStorage.setItem("ls_mesas_ativas", JSON.stringify(mesasAtivas));
  }, [mesasAtivas]);

  useEffect(()=>{
    localStorage.setItem("ls_strategy_configs_v257",JSON.stringify(strategies));
    const t=setTimeout(()=>fetch(`${api}/estrategias`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({configs:strategies})}).catch(()=>{}),700);
    return()=>clearTimeout(t);
  },[strategies,api]);

  const mesasView = mesas.length ? mesas : FALLBACK_MESAS;
  const mesa=useMemo(()=>mesasView.find(m=>m.id===mesaId) || mesasView[0],[mesasView,mesaId]);
  const stats=data?.estatisticas||mesa?.estatisticas||ops?.estatisticas||{};
  const sinal=data?.sinal;

  return <div className="app">
    <style>{css}</style>
    <header><button>☰</button><div className="brand"><b>LS</b><span>ROULETTE</span></div><em><i/>AO VIVO</em></header>

    {page==="inicio" && <Inicio mesa={mesa} sinal={sinal} stats={stats} ultimo={data?.ultimo} hist={data?.historico||[]} mesaId={mesaId} mesas={mesasView} setMesaId={setMesaId} mesasAtivas={mesasAtivas}/>}
    {page==="mesas" && <Mesas mesas={mesasView} mesaId={mesaId} setMesaId={setMesaId} mesasAtivas={mesasAtivas} setMesasAtivas={setMesasAtivas}/>} 
    {page==="estrategias" && <Estrategias strategies={strategies} setStrategies={setStrategies}/>}
    {page==="historico" && <Historico ops={ops} hist={data?.historico||[]} stats={stats}/>}
    {page==="config" && <Config api={api} setApi={setApi}/>}
    {page==="suporte" && <Suporte/>}

    <nav>{MENU.map(([id,ic,tx])=><button key={id} className={page===id?"active":""} onClick={()=>setPage(id)}><span>{ic}</span><small>{tx}</small></button>)}</nav>
  </div>
}

function Inicio({mesa,sinal,stats,ultimo,hist,mesaId,mesas=[],setMesaId,mesasAtivas={}}){
  const link=LINKS[mesaId]||AFILIADO_URL;
  return <main>
    <section className="mesaAtual"><div>{mesa?.icon||"🎰"}</div><p><span>MESA ATUAL</span><b>{mesa?.nome||sinal?.mesa||"Auto Roulette"}</b></p><em>● AO VIVO</em></section>
    <section className="mesaChips">{mesas.filter(m=>mesasAtivas[m.id] !== false).map(m=><button key={m.id} className={mesaId===m.id?"on":""} onClick={()=>setMesaId(m.id)}>{m.icon}<span>{m.curto||m.nome}</span></button>)}</section>
    <section className={`signal ${sinal?.statusOperacao||""}`}>
      <p className="status">{label(sinal)}</p>
      <h1 className={!sinal?.entrada ? "waitingTitle" : ""}>
        {sinal?.entrada ? <>ENTRAR EM<br/><strong>{sinal.entrada}</strong></> : "AGUARDANDO"}
      </h1>
      <small>{sinal?.motivo||"Aguardando padrão forte"}</small>
      <div className="info"><p><span>Proteção</span><b>🟢 {sinal?.cobertura||"ZERO"}</b></p><p><span>Até Gale</span><b>{sinal?.galeMax??2}</b></p><p><span>Confiança</span><b>{sinal?.confianca||"--"}</b></p></div>
      <a href={link} target="_blank">↗ ABRIR MESA</a>
      <button onClick={()=>navigator.clipboard?.writeText(`🚨 NOVA ENTRADA\n\nMesa: ${sinal?.mesa}\nEntrada: ${sinal?.entrada}\nCobertura: ZERO\n${link}`)}>🔗 COPIAR SINAL</button>
    </section>
    <section className="stats"><p><span>Greens</span><b>{stats?.greens??0}</b></p><p><span>Losses</span><b className="loss">{stats?.losses??0}</b></p><p><span>Assertividade</span><b>{stats?.assertividade||"0%"}</b></p></section>
    <section className="ultimos"><b>Últimos números</b><div>{hist.slice(0,10).map((n,i)=><span key={i} className={color(n.cor)}>{n.numero}</span>)}</div></section>
  </main>
}

function Mesas({mesas,mesaId,setMesaId,mesasAtivas,setMesasAtivas}){
  const toggleMesa=(id)=>{
    setMesasAtivas((old)=>({...old,[id]: old[id] === false ? true : false}));
  };

  return <main><h2>Mesas</h2><p className="desc">Selecione quais mesas ficam ativas no sistema</p><div className="mesasGrid">{mesas.map(m=>{
    const ativa = mesasAtivas?.[m.id] !== false;
    return <article className={`mesaPremium ${mesaId===m.id?"sel":""} ${!ativa?"off":""}`} key={m.id}>
      <button className="mesaSelect" onClick={()=>setMesaId(m.id)}>
        <div className="mesaLogo">{m.icon}</div>
        <div className="mesaInfo">
          <b>{m.nome}</b>
          <small>● {m.status?.online?"AO VIVO":"AGUARDANDO"}</small>
          <span>Último: <strong className={color(m.ultimo?.cor)}>{m.ultimo?.numero??"--"}</strong></span>
          <em>✅ {m.estatisticas?.greens ?? 0} • ❌ {m.estatisticas?.losses ?? 0}</em>
        </div>
      </button>
      <div className="mesaActions">
        <label className="mesaSwitch">
          <input type="checkbox" checked={ativa} onChange={()=>toggleMesa(m.id)} />
          <u />
        </label>
        <a href={LINKS[m.id]||AFILIADO_URL} target="_blank">ABRIR</a>
      </div>
    </article>
  })}</div></main>
}

function Estrategias({strategies,setStrategies}){
  const [filtro,setFiltro]=useState("todas");

  const upd=(id,patch)=>setStrategies(a=>a.map(s=>s.id===id?{...s,...patch}:s));
  const inc=(id,key,step=1)=>setStrategies(a=>a.map(s=>s.id===id?{...s,[key]:Math.max(0,Number(s[key]||0)+step)}:s));

  const filtradas = strategies.filter((s)=>{
    if(filtro==="ativas") return !!s.active;
    if(filtro==="desativadas") return !s.active;
    if(filtro==="configuradas") return Number(s.min)>0 || Number(s.gale)>0 || s.coverZero;
    return true;
  });

  const addPersonalizada=()=>{
    const id=`personalizada_${Date.now()}`;
    setStrategies(a=>[
      ...a,
      {
        id,
        title:`Personalizada ${a.filter(x=>String(x.id).startsWith("personalizada")).length+1}`,
        desc:"Estratégia criada manualmente",
        icon:"⭐",
        active:true,
        min:3,
        gale:2,
        conf:70,
        coverZero:true
      }
    ]);
    setFiltro("todas");
  };

  const salvar=()=>{
    localStorage.setItem("ls_strategy_configs_v257",JSON.stringify(strategies));
    alert("Estratégias salvas ✅");
  };

  return <main className="estrategiasPage">
    <div className="pageHead">
      <h2>Estratégias</h2>
      <button className="saveBtn" onClick={salvar}>SALVAR</button>
    </div>
    <p className="desc">Edite as regras. O motor usa exatamente o que estiver ativo aqui.</p>

    <div className="strategyTabs">
      <button className={filtro==="todas"?"on":""} onClick={()=>setFiltro("todas")}>Todas</button>
      <button className={filtro==="ativas"?"on":""} onClick={()=>setFiltro("ativas")}>Ativas</button>
      <button className={filtro==="configuradas"?"on":""} onClick={()=>setFiltro("configuradas")}>Configuradas</button>
      <button className={filtro==="desativadas"?"on":""} onClick={()=>setFiltro("desativadas")}>Desativadas</button>
    </div>

    <div className="list">{filtradas.map(s=><article className="strategyEditCard" key={s.id}>
      <div className="strategyTop">
        <i>{s.icon}</i>
        <div>
          <input
            className="strategyNameInput"
            value={s.title}
            onChange={e=>upd(s.id,{title:e.target.value})}
          />
          <input
            className="strategyDescInput"
            value={s.desc}
            onChange={e=>upd(s.id,{desc:e.target.value})}
          />
        </div>
        <label className="editSwitch">
          <input type="checkbox" checked={!!s.active} onChange={e=>upd(s.id,{active:e.target.checked})}/>
          <u/>
        </label>
      </div>

      <div className="editControls">
        <div>
          <span>Min. sequência</span>
          <div className="stepper">
            <button onClick={()=>inc(s.id,"min",-1)}>-</button>
            <strong>{s.min}</strong>
            <button onClick={()=>inc(s.id,"min",1)}>+</button>
          </div>
        </div>

        <div>
          <span>Até Gale</span>
          <div className="stepper">
            <button onClick={()=>inc(s.id,"gale",-1)}>-</button>
            <strong>{s.gale}</strong>
            <button onClick={()=>inc(s.id,"gale",1)}>+</button>
          </div>
        </div>

        <div>
          <span>Proteção</span>
          <button className={s.coverZero?"zeroBtn on":"zeroBtn"} onClick={()=>upd(s.id,{coverZero:!s.coverZero})}>
            {s.coverZero?"ZERO":"SEM ZERO"}
          </button>
        </div>
      </div>

      {String(s.id).startsWith("personalizada") && (
        <button className="removeStrategy" onClick={()=>setStrategies(a=>a.filter(x=>x.id!==s.id))}>
          REMOVER PERSONALIZADA
        </button>
      )}
    </article>)}</div>

    <button className="addStrategy" onClick={addPersonalizada}>+ ADICIONAR ESTRATÉGIA PERSONALIZADA</button>
    <p className="footNote">Abas Ativas, Configuradas e Desativadas agora funcionam.</p>
  </main>
}

function Historico({ops,hist,stats}){
  const lista=ops?.operacoes||[];
  return <main><h2>Histórico</h2><section className="stats"><p><span>Greens</span><b>{stats?.greens??0}</b></p><p><span>Loss</span><b className="loss">{stats?.losses??0}</b></p><p><span>Assert.</span><b>{stats?.assertividade||"0%"}</b></p></section><div className="history">{lista.length?lista.map(o=><div key={o.id}><p><b>{o.status}</b><small>{o.mesa}</small></p><strong>{o.entrada}</strong><span>{new Date(o.criadoEm).toLocaleTimeString()}</span></div>):hist.slice(0,30).map((h,i)=><div key={i}><p><b className={color(h.cor)}>{h.numero}</b><small>{h.mesa}</small></p><strong>{h.duzia}</strong><span>{new Date(h.horario).toLocaleTimeString()}</span></div>)}</div></main>
}

function Config({api,setApi}){
  const [v,setV]=useState(api);
  return <main><h2>Configurações</h2><div className="settings"><label>URL da API<input value={v} onChange={e=>setV(e.target.value)}/></label><label>WhatsApp / Grupo<input placeholder="5511999999999 ou grupo" /></label><p>🔔 Notificações <em>ON</em></p><p>🔊 Som <em>ON</em></p><p>📳 Vibração <em>ON</em></p><button onClick={()=>{localStorage.setItem("ls_api_url",v);setApi(v)}}>SALVAR</button></div></main>
}

function Suporte(){
  return <main><section className="support"><h2>🎧 Suporte</h2><p>Precisa de ajuda com o LS Roleta?</p><a href="https://wa.me/" target="_blank">CHAMAR NO WHATSAPP</a></section><section className="support"><h3>🎰 Plataforma</h3><p>Use seu link oficial de afiliado.</p><a href={AFILIADO_URL} target="_blank">ABRIR CADASTRO</a></section></main>
}

const css=`
*{box-sizing:border-box}body{margin:0;background:#020405;color:#fff;font-family:Inter,system-ui,Arial}.app{max-width:520px;min-height:100vh;margin:auto;background:radial-gradient(circle at top,#10231d,#030607 42%,#020304);padding:18px 16px 92px}header{display:flex;align-items:center;justify-content:space-between}header button{font-size:26px;background:0;border:0;color:white}.brand b{font-size:42px;color:#48df38;font-style:italic;letter-spacing:-3px}.brand span{font-weight:1000;margin-left:8px}header em{background:#111b19;border-radius:14px;padding:9px 12px;font-style:normal;font-weight:900;font-size:13px}header i{display:inline-block;width:9px;height:9px;background:#34e96d;border-radius:50%;margin-right:7px}.mesaAtual,.signal,.stats,.ultimos,.mesa,.strat,.settings,.support{background:linear-gradient(180deg,#0c1518,#060a0c);border:1px solid #1f3037;border-radius:20px}.mesaAtual{display:flex;align-items:center;gap:12px;padding:13px;margin:18px 0}.mesaAtual div{font-size:36px}.mesaAtual p{margin:0;flex:1}.mesaAtual span,.stats span,.signal span{display:block;color:#9eadb5;text-transform:uppercase;font-size:10px;font-weight:900}.mesaAtual b{font-size:18px}.mesaAtual em{font-style:normal;color:#4af64f;font-size:11px;font-weight:1000}.signal{text-align:center;padding:23px;border-color:#45fb4d;box-shadow:0 0 30px #35ff4d22}.status{font-weight:1000;color:#55ff54}.signal h1{font-size:clamp(44px,13vw,76px);line-height:.92;margin:8px 0;text-transform:uppercase;letter-spacing:-2px}.signal small{color:#b6c4ca;font-weight:800}.info{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;margin:22px 0;background:#25343b;border-radius:17px;overflow:hidden}.info p{background:#091014;margin:0;padding:12px 6px}.info b{font-size:14px}.signal a,.settings button,.support a{display:block;background:linear-gradient(135deg,#3bd937,#26aa2a);color:white;text-decoration:none;border:0;border-radius:14px;padding:16px;margin-top:12px;font-weight:1000}.signal button{width:100%;background:#071013;border:1px solid #223038;color:#fff;border-radius:14px;padding:15px;margin-top:10px;font-weight:900}.stats{display:grid;grid-template-columns:repeat(3,1fr);margin:14px 0;padding:12px 0}.stats p{text-align:center;margin:0;border-right:1px solid #23333a}.stats p:last-child{border:0}.stats b{font-size:26px;color:#52e943}.loss{color:#ff4a54!important}.ultimos{padding:14px}.ultimos div{display:flex;gap:8px;overflow:auto;margin-top:12px}.ultimos span{min-width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-weight:1000;background:#222}.red{background:#b51f28!important;color:white}.black{background:#1a2027!important;color:white}.green{background:#08a85b!important;color:white}h2{text-transform:uppercase;font-size:30px;margin:18px 0 6px}.desc{color:#adbac2;margin-top:0}.list{display:grid;gap:12px}.mesa,.strat{width:100%;padding:14px;color:white;text-align:left;display:flex;gap:12px;align-items:center}.mesa.sel{border-color:#45ff4d}.mesa i,.strat i{width:62px;height:62px;display:grid;place-items:center;border-radius:50%;background:#10191d;font-size:28px;color:#5cff50;font-style:normal;font-weight:1000}.mesa p,.strat p{margin:0;flex:1}.mesa b,.strat b{display:block;text-transform:uppercase}.mesa small,.strat small{display:block;color:#aebbC4;margin-top:5px}.mesa span{display:block;margin-top:8px}.mesa em{font-style:normal;color:#54ff54;font-weight:1000}.strat label input{display:none}.strat label u{display:block;width:50px;height:28px;border-radius:99px;background:#2a3338;position:relative}.strat label u:after{content:"";width:24px;height:24px;background:white;border-radius:50%;position:absolute;left:2px;top:2px}.strat label input:checked+u{background:#2fd739}.strat label input:checked+u:after{left:24px}.strat input{width:34px;background:transparent;border:0;color:white;font-weight:1000}.history{display:grid;gap:10px}.history div{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;background:#071013;border:1px solid #1f3037;border-radius:14px;padding:13px}.history p{margin:0}.history small{display:block;color:#aebac2}.settings,.support{padding:16px;margin-top:12px}.settings label{display:block;margin-bottom:14px;color:#ced7dc}.settings input{width:100%;background:#020506;border:1px solid #25343b;color:white;border-radius:12px;padding:13px;margin-top:8px}.settings p{display:flex;justify-content:space-between}.settings em{color:#54ff54;font-style:normal;font-weight:1000}nav{position:fixed;left:50%;transform:translateX(-50%);bottom:0;width:min(520px,100%);height:78px;background:#05090b;border-top:1px solid #1e2d34;display:grid;grid-template-columns:repeat(6,1fr)}nav button{background:0;border:0;color:#aab5bd;font-weight:900}nav button.active{color:#50f24b}nav span{display:block;font-size:22px}nav small{font-size:10px}
/* 42.1: selecionar mesas + layout */
.app{max-width:430px;width:100%;overflow-x:hidden}
.signal h1{font-size:clamp(42px,12vw,66px);word-break:normal;overflow-wrap:break-word}
.mesaChips{display:flex;gap:8px;overflow-x:auto;padding:2px 0 12px;margin-top:-8px}
.mesaChips button{min-width:78px;border:1px solid #20323a;background:#071013;color:#dfffe3;border-radius:14px;padding:9px 8px;font-weight:900}
.mesaChips button.on{border-color:#47ff4d;box-shadow:0 0 0 1px #47ff4d44}
.mesaChips span{display:block;font-size:10px;margin-top:3px;white-space:nowrap}
.mesasGrid{display:grid;gap:12px}
.mesaPremium{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;background:linear-gradient(180deg,#0b1417,#05090b);border:1px solid #1f3037;border-radius:20px;padding:12px;color:#fff}
.mesaPremium.sel{border-color:#47ff4d;box-shadow:0 0 0 1px #47ff4d55,0 0 18px #36ff4d22}
.mesaPremium.off{opacity:.55}
.mesaSelect{display:grid;grid-template-columns:58px 1fr;gap:12px;align-items:center;background:transparent;border:0;color:#fff;text-align:left;padding:0}
.mesaLogo{width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:#11191d;border:1px solid #293b43;font-size:28px}
.mesaInfo b{display:block;text-transform:uppercase;font-size:14px}
.mesaInfo small{display:block;color:#4fff56;font-weight:1000;margin-top:4px}
.mesaInfo span{display:block;color:#c9d2d7;margin-top:7px}
.mesaInfo strong{display:inline-grid;place-items:center;min-width:28px;height:28px;border-radius:50%;padding:0 7px;margin-left:4px}
.mesaInfo em{display:block;color:#9fafb7;font-style:normal;font-size:12px;margin-top:6px}
.mesaActions{display:grid;gap:10px;justify-items:end}
.mesaActions>a{border:1px solid #46ff4d;color:#55ff59;text-decoration:none;border-radius:10px;padding:9px 10px;font-size:11px;font-weight:1000}
.mesaSwitch input{display:none}
.mesaSwitch u{display:block;width:48px;height:28px;border-radius:999px;background:#2a3338;position:relative}
.mesaSwitch u:after{content:"";position:absolute;width:24px;height:24px;background:#fff;border-radius:50%;top:2px;left:2px;transition:.2s}
.mesaSwitch input:checked+u{background:#2fd739}
.mesaSwitch input:checked+u:after{left:22px}
.ultimos{margin-bottom:14px}
nav{z-index:999}
@media(max-width:430px){.app{max-width:none}.signal h1{font-size:clamp(40px,14vw,62px)}}

/* 42.1 ajustes finais */
.signal h1.waitingTitle{
  font-size:clamp(38px,10vw,54px)!important;
  letter-spacing:-1px;
  line-height:1.02;
}
.signal h1 strong{
  display:block;
  font-size:clamp(44px,13vw,72px);
  line-height:.92;
}
.signal h1{
  overflow-wrap:anywhere;
}
.pageHead{display:flex;align-items:center;justify-content:space-between;gap:12px}
.saveBtn{border:0;background:#38d736;color:#061006;border-radius:12px;padding:12px 16px;font-weight:1000}
.strategyTabs{display:flex;gap:10px;overflow:auto;margin:12px 0 16px;padding-bottom:4px}
.strategyTabs button{background:transparent;color:#b7c3ca;border:0;text-transform:uppercase;font-size:11px;font-weight:1000;padding:10px 12px;border-bottom:2px solid transparent}
.strategyTabs button.on{color:#4dff4d;border-color:#4dff4d}
.strategyEditCard{
  background:linear-gradient(180deg,#0b1418,#05090b);
  border:1px solid #1f3037;
  border-radius:18px;
  padding:14px;
  color:#fff;
}
.strategyTop{display:grid;grid-template-columns:58px 1fr auto;gap:12px;align-items:center}
.strategyTop>i{width:58px;height:58px;border-radius:16px;background:#11191d;border:1px solid #2c3e46;display:grid;place-items:center;font-size:24px;font-style:normal;color:#5cff50;font-weight:1000}
.strategyTop b{display:block;text-transform:uppercase;font-size:15px}
.strategyTop small{display:block;color:#aebbc2;margin-top:4px}
.editSwitch input{display:none}
.editSwitch u{display:block;width:52px;height:30px;border-radius:999px;background:#374349;position:relative}
.editSwitch u:after{content:"";position:absolute;width:26px;height:26px;background:#fff;border-radius:50%;left:2px;top:2px;transition:.2s}
.editSwitch input:checked+u{background:#33db39}
.editSwitch input:checked+u:after{left:24px}
.editControls{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:14px;border-top:1px solid #1d2b31;padding-top:12px}
.editControls span{display:block;color:#9eaeb6;text-transform:uppercase;font-size:9px;font-weight:1000;text-align:center}
.stepper{display:grid;grid-template-columns:28px 1fr 28px;align-items:center;gap:4px;margin-top:7px}
.stepper button{border:0;background:#1a252b;color:#fff;border-radius:8px;height:28px;font-weight:1000;font-size:17px}
.stepper strong{text-align:center;font-size:18px}
.zeroBtn{margin-top:7px;width:100%;height:30px;border:1px solid #283940;background:#10191d;color:#fff;border-radius:9px;font-weight:1000;font-size:11px}
.zeroBtn.on{color:#54ff55;border-color:#54ff55}
.addStrategy{width:100%;margin:14px 0 8px;border:0;background:#32d735;color:#061006;border-radius:14px;padding:15px;font-weight:1000}
.footNote{text-align:center;color:#97a7af;font-size:12px;margin-bottom:80px}
@media(max-width:380px){
  .editControls{grid-template-columns:1fr}
  .signal h1.waitingTitle{font-size:38px!important}
}

/* 42.1 ajustes finais sem foto */
.signal h1.waitingTitle,
.signal h1{
  max-width:100%;
}
.signal h1.waitingTitle{
  font-size:clamp(32px,8.5vw,46px)!important;
  line-height:1!important;
  letter-spacing:-.5px!important;
}
.signal h1 strong{
  font-size:clamp(40px,12vw,68px)!important;
}
.mesaChips::-webkit-scrollbar,
.strategyTabs::-webkit-scrollbar{
  display:none;
}
.mesaChips,
.strategyTabs{
  scrollbar-width:none;
}
.mesaLogo{
  font-size:24px!important;
  letter-spacing:-4px;
  overflow:hidden;
}
.mesaPremium:last-child .mesaLogo{
  font-size:20px!important;
  letter-spacing:-6px;
  padding-right:5px;
}
.strategyTabs button{
  cursor:pointer;
}
.strategyNameInput{
  width:100%;
  background:transparent;
  border:0;
  color:#fff;
  font-weight:1000;
  text-transform:uppercase;
  font-size:15px;
  outline:none;
}
.strategyDescInput{
  width:100%;
  background:transparent;
  border:0;
  color:#aebbc2;
  margin-top:4px;
  outline:none;
}
.removeStrategy{
  width:100%;
  margin-top:12px;
  border:1px solid #ff4a54;
  background:#1a090b;
  color:#ff6b73;
  border-radius:10px;
  padding:10px;
  font-weight:1000;
}

`;
