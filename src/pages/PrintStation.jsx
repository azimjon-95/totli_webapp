// src/pages/PrintStation.jsx
// Telefonda doim ochiq turadi — sotuv bo'lsa avtomatik chek chiqaradi
// RawBT ilovasi orqali Bluetooth printerga yuboradi

import React, { useEffect, useState, useRef, useCallback } from "react";
import io from "socket.io-client";

const SERVER = "https://cake.medme.uz";
const RAWBT   = "http://localhost:8080"; // RawBT lokal API

export default function PrintStation() {
  const [status,   setStatus]   = useState("connecting"); // connecting|ready|printing|error
  const [lastJob,  setLastJob]  = useState(null);
  const [log,      setLog]      = useState([]);
  const [btStatus, setBtStatus] = useState("unknown");
  const [printCount, setPrintCount] = useState(0);
  const socketRef = useRef(null);
  const audioRef  = useRef(null);

  const addLog = useCallback((msg, type = "info") => {
    const time = new Date().toLocaleTimeString("uz-UZ", { timeZone: "Asia/Tashkent" });
    setLog(prev => [{ time, msg, type }, ...prev].slice(0, 30));
  }, []);

  // ── RawBT ga matn yuborish ──────────────────────────
  const sendToRawBT = useCallback(async (text) => {
    try {
      // RawBT HTTP API: POST /rawbt
      const resp = await fetch(`${RAWBT}/rawbt`, {
        method: "POST",
        headers: { "Content-Type": "text/plain; charset=utf-8" },
        body: text,
      });
      if (resp.ok) {
        addLog("✅ Chek printerga yuborildi", "success");
        return true;
      } else {
        addLog(`⚠️ RawBT: ${resp.status}`, "warn");
        return false;
      }
    } catch (e) {
      addLog(`❌ RawBT ulanmadi: ${e.message}`, "error");
      setBtStatus("error");
      return false;
    }
  }, [addLog]);

  // ── RawBT holati tekshirish ──────────────────────────
  const checkRawBT = useCallback(async () => {
    try {
      const r = await fetch(`${RAWBT}/rawbt`, { method: "GET", signal: AbortSignal.timeout(3000) });
      if (r.ok || r.status === 405) {
        setBtStatus("ok");
        addLog("✅ RawBT tayyor", "success");
      }
    } catch {
      setBtStatus("error");
      addLog("⚠️ RawBT ishlamayapti — ilova ochiq emasmi?", "warn");
    }
  }, [addLog]);

  // ── Print trigger ───────────────────────────────────
  const handlePrintJob = useCallback(async (data) => {
    setStatus("printing");
    setLastJob(data);
    addLog(`📦 Sotuv: #${data.sale?.orderNo} — ${Number(data.sale?.paidTotal||0).toLocaleString("uz-UZ")} so'm`);

    // Ovoz signal
    try { audioRef.current?.play(); } catch {}

    const ok = await sendToRawBT(data.receiptText);
    if (ok) {
      setPrintCount(p => p + 1);
      setStatus("ready");
    } else {
      setStatus("error");
      // Fallback: window.print()
      addLog("🔄 Fallback: brauzer print...", "warn");
      setTimeout(() => { window.print(); setStatus("ready"); }, 500);
    }
  }, [sendToRawBT, addLog]);

  // ── Socket.IO ulanish ───────────────────────────────
  useEffect(() => {
    const socket = io(SERVER, {
      transports: ["websocket"],
      reconnectionDelay: 2000,
      reconnectionAttempts: 99,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("ready");
      addLog("🟢 Server bilan ulandi", "success");
      checkRawBT();
    });

    socket.on("disconnect", () => {
      setStatus("connecting");
      addLog("🔴 Ulanish uzildi, qayta ulanmoqda...", "warn");
    });

    socket.on("reconnect", () => {
      addLog("🔄 Qayta ulandi", "success");
      setStatus("ready");
    });

    socket.on("print:receipt", (data) => {
      handlePrintJob(data);
    });

    return () => socket.disconnect();
  }, [handlePrintJob, addLog, checkRawBT]);

  // ── Sahifani yopmaslik uchun visibility API ─────────
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        addLog("⚠️ Sahifa fonda — chek chiqarishda muammo bo'lishi mumkin", "warn");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [addLog]);

  // ── Test print ──────────────────────────────────────
  const testPrint = useCallback(() => {
    const testText = [
      "================================",
      "        TOTLI TORTLAR          ",
      "================================",
      "TEST CHEK                      ",
      "Sana: " + new Date().toLocaleString("uz-UZ"),
      "--------------------------------",
      "Tort Shokoladniy   1    120 000",
      "Pepsi              2     36 000",
      "--------------------------------",
      "JAMI:             156 000 so'm  ",
      "================================",
      "    Xaridingiz uchun rahmat!    ",
      "================================",
      "\n\n\n",
    ].join("\n");
    sendToRawBT(testText);
    addLog("🖨 Test chek yuborildi", "info");
  }, [sendToRawBT, addLog]);

  const statusColor = {
    connecting: "#f7c948",
    ready:      "#43d9a2",
    printing:   "#5b8af7",
    error:      "#ff6b6b",
  }[status] || "#888";

  const statusText = {
    connecting: "Ulanmoqda...",
    ready:      "Tayyor ✅",
    printing:   "Chek chiqmoqda... 🖨",
    error:      "Xatolik ⚠️",
  }[status];

  return (
    <div style={styles.wrap}>
      {/* Ovoz signali uchun */}
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAA..." preload="auto"/>

      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.logo}>🖨</div>
        <div style={styles.title}>Print Station</div>
        <div style={styles.subtitle}>Avtomatik chek chiqaruvchi</div>
      </div>

      {/* STATUS */}
      <div style={{ ...styles.statusCard, borderColor: statusColor }}>
        <div style={{ ...styles.statusDot, background: statusColor,
          animation: status === "printing" ? "pulse 1s infinite" : "none"
        }}/>
        <div>
          <div style={{ ...styles.statusText, color: statusColor }}>{statusText}</div>
          <div style={styles.statusSub}>
            Bluetooth: {btStatus === "ok" ? "✅ Tayyor" : btStatus === "error" ? "❌ RawBT ishlamayapti" : "⏳ Tekshirilmoqda"}
          </div>
        </div>
        <div style={styles.counter}>{printCount}</div>
      </div>

      {/* SETUP GUIDE (RawBT yo'q bo'lsa) */}
      {btStatus === "error" && (
        <div style={styles.guide}>
          <div style={styles.guideTitle}>⚙️ RawBT sozlash:</div>
          <div style={styles.guideStep}>1. Play Store dan <b>RawBT</b> ilovasini o'rnating</div>
          <div style={styles.guideStep}>2. RawBT ni oching → Settings → Enable HTTP</div>
          <div style={styles.guideStep}>3. Bluetooth printeringizni ulang</div>
          <div style={styles.guideStep}>4. Pastdagi "Tekshirish" tugmasini bosing</div>
        </div>
      )}

      {/* LAST JOB */}
      {lastJob && (
        <div style={styles.lastJob}>
          <div style={styles.lastJobTitle}>Oxirgi chek:</div>
          <div style={styles.lastJobRow}>
            <span>№</span><span>#{lastJob.sale?.orderNo}</span>
          </div>
          <div style={styles.lastJobRow}>
            <span>Summa</span>
            <span>{Number(lastJob.sale?.paidTotal||0).toLocaleString("uz-UZ")} so'm</span>
          </div>
          <div style={styles.lastJobRow}>
            <span>Mahsulotlar</span>
            <span>{lastJob.sale?.items?.length || 0} ta</span>
          </div>
        </div>
      )}

      {/* BUTTONS */}
      <div style={styles.btns}>
        <button style={styles.btnTest} onClick={testPrint}>🖨 Test chek</button>
        <button style={styles.btnCheck} onClick={checkRawBT}>🔄 Tekshirish</button>
      </div>

      {/* LOG */}
      <div style={styles.logWrap}>
        <div style={styles.logTitle}>Jurnal:</div>
        {log.map((l, i) => (
          <div key={i} style={{
            ...styles.logRow,
            color: l.type === "error" ? "#ff6b6b"
                 : l.type === "success" ? "#43d9a2"
                 : l.type === "warn" ? "#f7c948"
                 : "#aaa"
          }}>
            <span style={styles.logTime}>{l.time}</span>
            <span>{l.msg}</span>
          </div>
        ))}
        {!log.length && <div style={styles.logEmpty}>Hozircha hodisalar yo'q</div>}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        body { margin:0; background:#0d0f18; }
      `}</style>
    </div>
  );
}

const styles = {
  wrap:       { minHeight:"100vh", background:"#0d0f18", color:"#fff",
                fontFamily:"system-ui,sans-serif", padding:"16px", maxWidth:"400px", margin:"0 auto" },
  header:     { textAlign:"center", marginBottom:"20px", paddingTop:"8px" },
  logo:       { fontSize:"40px", marginBottom:"6px" },
  title:      { fontSize:"20px", fontWeight:"800", letterSpacing:".05em" },
  subtitle:   { fontSize:"12px", color:"rgba(255,255,255,.5)", marginTop:"3px" },

  statusCard: { display:"flex", alignItems:"center", gap:"12px",
                background:"rgba(255,255,255,.05)", border:"1.5px solid",
                borderRadius:"14px", padding:"14px 16px", marginBottom:"14px" },
  statusDot:  { width:"12px", height:"12px", borderRadius:"50%", flexShrink:0 },
  statusText: { fontSize:"15px", fontWeight:"700" },
  statusSub:  { fontSize:"11px", color:"rgba(255,255,255,.5)", marginTop:"2px" },
  counter:    { marginLeft:"auto", fontSize:"28px", fontWeight:"900",
                color:"rgba(255,255,255,.15)" },

  guide:      { background:"rgba(247,201,72,.08)", border:"1px solid rgba(247,201,72,.3)",
                borderRadius:"12px", padding:"14px", marginBottom:"14px" },
  guideTitle: { fontSize:"13px", fontWeight:"700", color:"#f7c948", marginBottom:"8px" },
  guideStep:  { fontSize:"12px", color:"rgba(255,255,255,.7)", marginBottom:"5px", lineHeight:"1.5" },

  lastJob:    { background:"rgba(255,255,255,.04)", borderRadius:"12px",
                padding:"12px 14px", marginBottom:"14px" },
  lastJobTitle:{ fontSize:"11px", color:"rgba(255,255,255,.4)", marginBottom:"8px",
                 textTransform:"uppercase", letterSpacing:".05em" },
  lastJobRow: { display:"flex", justifyContent:"space-between",
                fontSize:"12px", color:"rgba(255,255,255,.8)", padding:"3px 0" },

  btns:       { display:"flex", gap:"10px", marginBottom:"16px" },
  btnTest:    { flex:1, padding:"12px", background:"#f7c948", color:"#111",
                border:"none", borderRadius:"10px", fontWeight:"700",
                fontSize:"13px", cursor:"pointer" },
  btnCheck:   { flex:1, padding:"12px", background:"rgba(255,255,255,.08)", color:"#fff",
                border:"1px solid rgba(255,255,255,.15)", borderRadius:"10px",
                fontWeight:"600", fontSize:"13px", cursor:"pointer" },

  logWrap:    { background:"rgba(0,0,0,.3)", borderRadius:"12px", padding:"12px" },
  logTitle:   { fontSize:"11px", color:"rgba(255,255,255,.3)", marginBottom:"8px",
                textTransform:"uppercase", letterSpacing:".05em" },
  logRow:     { display:"flex", gap:"8px", fontSize:"11px",
                padding:"3px 0", borderBottom:"1px solid rgba(255,255,255,.04)" },
  logTime:    { color:"rgba(255,255,255,.25)", flexShrink:0, width:"50px" },
  logEmpty:   { fontSize:"12px", color:"rgba(255,255,255,.2)", textAlign:"center", padding:"8px" },
};
