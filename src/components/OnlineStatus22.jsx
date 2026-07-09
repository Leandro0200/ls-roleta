import { useEffect, useState } from "react";
import { getApiStatus } from "../services/onlineApi";
import "./OnlineStatus22.css";

export default function OnlineStatus22() {
  const [online, setOnline] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const data = await getApiStatus();
        if (!ativo) return;
        setOnline(Boolean(data.online));
        setLastUpdate(new Date(data.updatedAt).toLocaleTimeString("pt-BR"));
      } catch {
        if (!ativo) return;
        setOnline(false);
      }
    }

    carregar();
    const timer = setInterval(carregar, 15000);

    return () => {
      ativo = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className={`online-status-22 ${online ? "on" : "off"}`}>
      <span>{online ? "● AO VIVO" : "● OFFLINE"}</span>
      <small>{lastUpdate || "API"}</small>
    </div>
  );
}
