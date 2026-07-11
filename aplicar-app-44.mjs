import fs from "fs";

const file = process.argv[2] || "src/App.jsx";
let s = fs.readFileSync(file, "utf8");

function must(oldText, newText, label) {
  if (!s.includes(oldText)) {
    throw new Error(`Não encontrei o trecho: ${label}`);
  }
  s = s.replace(oldText, newText);
}

if (!s.includes('PainelWhatsApp44')) {
  s = 'import PainelWhatsApp44, { painelWhatsApp44Css } from "./components/PainelWhatsApp44.jsx";\n' + s;
}

must(
  '["historico","📊","Histórico"], ["config","⚙️","Config."], ["suporte","🎧","Suporte"]',
  '["historico","📊","Histórico"], ["whatsapp","📱","WhatsApp"], ["config","⚙️","Config."], ["suporte","🎧","Suporte"]',
  "menu WhatsApp"
);

must(
  '{page==="historico" && <Historico ops={ops} hist={data?.historico||[]} stats={stats}/>}\\n    {page==="config" && <Config api={api} setApi={setApi}/>} ',
  '{page==="historico" && <Historico ops={ops} hist={data?.historico||[]} stats={stats}/>}\\n    {page==="whatsapp" && <PainelWhatsApp44 api={api} mesas={mesasView} strategies={strategies}/>}\\n    {page==="config" && <Config api={api} setApi={setApi}/>} ',
  "tela WhatsApp"
);

must(
  '<style>{css}</style>',
  '<style>{css + painelWhatsApp44Css}</style>',
  "CSS WhatsApp"
);

fs.writeFileSync(file, s);
console.log("✅ App.jsx atualizado para LS Roleta 44.0");
