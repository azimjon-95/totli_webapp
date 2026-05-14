// src/App.js — TOTLI Dashboard (mobile-first, full filter)
import { useEffect, useMemo, useState, useCallback } from "react";
import { apiGet, isInTelegram, API_BASE } from "./hooks/api";
import { io } from "socket.io-client";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import "./global.css";
import "./app.css";

/* ── HELPERS ── */
function toMoney(n) { return Number(n || 0).toLocaleString("uz-UZ"); }
function todayISO() {
  const d = new Date(), p = v => String(v).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function monthStart() {
  const d = new Date(); d.setDate(1);
  const p = v => String(v).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-01`;
}
function yearStart() {
  return `${new Date().getFullYear()}-01-01`;
}
function toISOStart(s) { const [y, m, d] = s.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d, 0, 0, 0)).toISOString(); }
function toISOEnd(s) { const [y, m, d] = s.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999)).toISOString(); }

const fmtT = new Intl.DateTimeFormat("uz-UZ", { timeZone: "Asia/Tashkent", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
function fmtDate(iso) { if (!iso) return "-"; const d = new Date(iso); return isNaN(d) ? String(iso) : fmtT.format(d); }

function useDebounce(v, d = 350) {
  const [s, set] = useState(v);
  useEffect(() => { const t = setTimeout(() => set(v), d); return () => clearTimeout(t); }, [v, d]);
  return s;
}

/* ── EXPENSE CATEGORIES ── */
const EXP_CATS = [
  { key: "all", label: "Hammasi", color: "#f7c948" },
  { key: "other", label: "Proche", color: "#a78bfa" },
  { key: "rent", label: "Arenda", color: "#4d9fff" },
  { key: "electric", label: "Elektr", color: "#22d3ee" },
  { key: "supplier", label: "Firma", color: "#fb923c" },
  { key: "cashbox", label: "Kapilka", color: "#22d47a" },
  { key: "worker", label: "Ishchi", color: "#f472b6" },
  { key: "lunch", label: "Abet", color: "#84cc16" },
  { key: "taxi", label: "Taksi", color: "#facc15" },
  { key: "master", label: "Usta", color: "#f87171" },
  { key: "bank_tax", label: "Bank", color: "#818cf8" },
];

/* ── PERIOD PRESETS ── */
const PERIODS = [
  { id: "today", label: "Bugun", from: todayISO, to: todayISO },
  { id: "month", label: "Oy", from: monthStart, to: todayISO },
  { id: "year", label: "Yil", from: yearStart, to: todayISO },
  { id: "custom", label: "Sana", from: null, to: null },
];

/* ── CUSTOM TOOLTIP ── */
function CTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 12px", fontSize: 12, fontFamily: "JetBrains Mono,monospace" }}>
      <div style={{ color: "rgba(240,242,248,0.5)", marginBottom: 4 }}>{label}:00</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {toMoney(p.value)}</div>
      ))}
    </div>
  );
}

/* ═══════════ APP ═══════════ */
export default function App() {
  const [period, setPeriod] = useState("today");
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());
  const [expCat, setExpCat] = useState("all");
  const [viewMode, setViewMode] = useState("list"); // list|chart
  const [tab, setTab] = useState("all");  // all|sale|expense

  const debFrom = useDebounce(from);
  const debTo = useDebounce(to);

  const [cards, setCards] = useState(null);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [todayLine, setTodayLine] = useState([]);
  const [yesterLine, setYesterLine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [unauth, setUnauth] = useState(false);
  const [liveFlash, setLiveFlash] = useState(false);

  const blocked = useMemo(() => {
    const h = window.location.hostname;
    const isLocal = h === "localhost" || h === "127.0.0.1" || h.endsWith(".ngrok-free.app");
    if (unauth) return true;
    return !(isInTelegram() || isLocal);
  }, [unauth]);

  /* ── LOAD ── */
  const loadAll = useCallback(async (f, t) => {
    setLoading(true); setErr("");
    try {
      const _f = f ?? from, _t = t ?? to;
      const q = `from=${encodeURIComponent(toISOStart(_f))}&to=${encodeURIComponent(toISOEnd(_t))}`;
      const catQ = expCat !== "all" ? `&categoryKey=${expCat}` : "";
      const [rep, act, ch] = await Promise.all([
        apiGet(`/dashboard/summary?${q}`),
        apiGet(`/dashboard/activity?${q}${catQ}`),
        apiGet(`/dashboard/chart?${q}`),
      ]);
      setCards(rep.cards);
      setSales(act.sales || []);
      setExpenses(act.expenses || []);
      setTodayLine(ch.today || []);
      setYesterLine(ch.yesterday || []);
    } catch (e) {
      const msg = e?.message || "Xatolik";
      if (msg.includes("UNAUTHORIZED") || msg.includes("401") || msg.includes("FORBIDDEN") || msg.includes("403")) setUnauth(true);
      setErr(msg);
    } finally { setLoading(false); }
  }, [from, to, expCat]);

  /* ── PERIOD CHANGE ── */
  const applyPeriod = useCallback((pid) => {
    setPeriod(pid);
    if (pid === "custom") return;
    const p = PERIODS.find(x => x.id === pid);
    if (p) { const f = p.from(), t = p.to(); setFrom(f); setTo(t); loadAll(f, t); }
  }, [loadAll]);

  /* ── INIT ── */
  useEffect(() => {
    if (blocked) return;
    window.Telegram?.WebApp?.ready?.();
    window.Telegram?.WebApp?.expand?.();
    loadAll();
    const s = io(API_BASE, { transports: ["websocket"], withCredentials: true });
    s.on("refresh", () => { setLiveFlash(true); setTimeout(() => setLiveFlash(false), 1200); loadAll(); });
    s.on("dash:update", () => loadAll());
    return () => s.close();
  }, [blocked]);

  useEffect(() => { if (!blocked) loadAll(debFrom, debTo); }, [debFrom, debTo, expCat]);

  /* ── FILTERED LISTS ── */
  const mixed = useMemo(() => {
    const s = sales.map(o => ({ type: "sale", at: new Date(o.createdAt).getTime(), ...o, money: o.paidTotal ?? o.total ?? 0 }));
    const e = expenses
      .filter(x => expCat === "all" || x.categoryKey === expCat)
      .map(x => ({ type: "expense", at: new Date(x.createdAt).getTime(), ...x, money: x.amount ?? 0 }));
    const src = tab === "sale" ? s : tab === "expense" ? e : [...s, ...e];
    return src.sort((a, b) => b.at - a.at).slice(0, 60);
  }, [sales, expenses, expCat, tab]);

  /* ── PIE DATA ── */
  const pieData = useMemo(() => {
    const map = {};
    expenses.forEach(x => {
      const k = x.categoryKey || "other";
      map[k] = (map[k] || 0) + Number(x.amount || 0);
    });
    return Object.entries(map).map(([k, v]) => {
      const cat = EXP_CATS.find(c => c.key === k) || { label: k, color: "#888" };
      return { name: cat.label, value: v, color: cat.color };
    }).sort((a, b) => b.value - a.value);
  }, [expenses]);

  const chartData = useMemo(() => {
    const map = new Map();
    (todayLine || []).forEach(t => map.set(t.hour, { hour: t.hour, bugun: t.value, kecha: 0 }));
    (yesterLine || []).forEach(y => {
      const c = map.get(y.hour) || { hour: y.hour, bugun: 0, kecha: 0 };
      c.kecha = y.value; map.set(y.hour, c);
    });
    return Array.from(map.values()).sort((a, b) => Number(a.hour) - Number(b.hour));
  }, [todayLine, yesterLine]);

  if (blocked) return (
    <div className="db-block">
      <div className="db-block__inner">
        <div className="db-block__icon">🔒</div>
        <div className="db-block__title">Kirish cheklangan</div>
        <div className="db-block__text">Ruxsat olish uchun administratorga murojaat qiling</div>
        <a href="https://t.me/Azimjon_M" className="db-block__link">@Azimjon_M</a>
      </div>
    </div>
  );

  return (
    <div className="db-root">
      {/* ── LIVE FLASH ── */}
      {liveFlash && <div className="db-live-flash" />}

      {/* ── HEADER ── */}
      <header className="db-header">
        <div className="db-header__logo">
          <span className="db-header__dot" />
          <span className="db-header__name">totli</span>
        </div>
        <div className="db-header__live">
          <span className="db-live-dot" />
          <span>jonli</span>
        </div>
      </header>

      {/* ── PERIOD TABS ── */}
      <div className="db-periods">
        {PERIODS.map(p => (
          <button key={p.id} className={`db-period${period === p.id ? " is-on" : ""}`} onClick={() => applyPeriod(p.id)}>
            {p.label}
          </button>
        ))}
      </div>

      {/* ── CUSTOM DATE ── */}
      {period === "custom" && (
        <div className="db-dates fadeUp">
          <input type="date" className="db-date-input" value={from} onChange={e => setFrom(e.target.value)} />
          <span className="db-date-sep">→</span>
          <input type="date" className="db-date-input" value={to} onChange={e => setTo(e.target.value)} />
        </div>
      )}

      {err && <div className="db-err fadeUp">⚠ {err}</div>}

      {/* ── CARDS ── */}
      <div className="db-cards">
        <CardItem icon="💰" label="Tushgan" value={toMoney(cards?.soldTotal)} color="green" loading={loading} />
        <CardItem icon="💸" label="Chiqim" value={toMoney(cards?.expenseSum)} color="red" loading={loading} />
        <CardItem icon="🏦" label="Balans" value={toMoney(cards?.balance)} color="gold" loading={loading} wide />
        <CardItem icon="📌" label="Qarz" value={toMoney(cards?.customerDebt)} color="orange" loading={loading} />
        <CardItem icon="🏭" label="Firmaga" value={toMoney(cards?.supplierDebt)} color="purple" loading={loading} />
      </div>

      {/* ── CHART BLOCK ── */}
      <div className="db-section">
        <div className="db-section__head">
          <span className="db-section__title">Soatbay tushum</span>
          <div className="db-legend">
            <span className="db-legend__dot" style={{ background: "#f7c948" }} />bugun
            <span className="db-legend__dot" style={{ background: "#4d9fff", marginLeft: 8 }} />kecha
          </div>
        </div>
        <div className="db-chart-wrap">
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "rgba(240,242,248,0.4)", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
              <Tooltip content={<CTooltip />} />
              <Line type="monotone" dataKey="bugun" stroke="#f7c948" strokeWidth={2} dot={false} name="bugun" />
              <Line type="monotone" dataKey="kecha" stroke="#4d9fff" strokeWidth={1.5} dot={false} strokeDasharray="4 3" name="kecha" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── EXPENSE PIE ── */}
      {pieData.length > 0 && (
        <div className="db-section">
          <div className="db-section__head">
            <span className="db-section__title">Chiqim toifalari</span>
          </div>
          <div className="db-chart-wrap" style={{ paddingBottom: 0 }}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} dataKey="value" paddingAngle={3}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} stroke="none" />)}
                </Pie>
                <Tooltip formatter={(v) => `${toMoney(v)} so'm`} contentStyle={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 12, fontFamily: "JetBrains Mono" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, fontFamily: "Outfit" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── ACTIVITY LIST ── */}
      <div className="db-section">
        <div className="db-section__head">
          <span className="db-section__title">Harakatlar</span>
          <button className="db-view-toggle" onClick={() => setViewMode(v => v === "list" ? "chart" : "list")}>
            {viewMode === "list" ? "📊" : "📋"}
          </button>
        </div>

        {/* ── TAB FILTER ── */}
        <div className="db-tabs">
          {["all", "sale", "expense"].map(t => (
            <button key={t} className={`db-tab${tab === t ? " is-on" : ""}`} onClick={() => setTab(t)}>
              {t === "all" ? "Barchasi" : t === "sale" ? "Sotuvlar" : "Chiqimlar"}
            </button>
          ))}
        </div>

        {/* ── CATEGORY FILTER (expense only) ── */}
        {(tab === "expense" || tab === "all") && (
          <div className="db-cats">
            {EXP_CATS.map(c => (
              <button key={c.key} className={`db-cat${expCat === c.key ? " is-on" : ""}`}
                style={expCat === c.key ? { borderColor: c.color, background: `${c.color}18`, color: c.color } : {}}
                onClick={() => setExpCat(c.key)}>
                {c.label}
              </button>
            ))}
          </div>
        )}

        {/* ── BAR CHART MODE ── */}
        {viewMode === "chart" && (
          <div className="db-chart-wrap fadeUp">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barCategoryGap="30%">
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "rgba(240,242,248,0.4)" }} tickLine={false} axisLine={false} />
                <Tooltip content={<CTooltip />} />
                <Bar dataKey="bugun" fill="#f7c948" radius={[4, 4, 0, 0]} name="bugun" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── LIST ── */}
        {viewMode === "list" && (
          <div className="db-list">
            {loading && [0, 1, 2, 3, 4].map(i => (
              <div key={i} className="db-row sk-row">
                <span className="sk" style={{ width: 36, height: 36, borderRadius: 10 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <span className="sk" style={{ width: "55%", height: 12 }} />
                  <span className="sk" style={{ width: "35%", height: 10 }} />
                </div>
                <span className="sk" style={{ width: 70, height: 20, borderRadius: 8 }} />
              </div>
            ))}
            {!loading && mixed.length === 0 && (
              <div className="db-empty">Hozircha ma'lumot yo'q</div>
            )}
            {!loading && mixed.map((x, i) => (
              <div key={`${x.type}-${x._id || i}`} className={`db-row db-row--${x.type} fadeUp`} style={{ animationDelay: `${i * 0.03}s` }}>
                <div className="db-row__icon">
                  {x.type === "sale" ? "🧁" : "💸"}
                </div>
                <div className="db-row__body">
                  <div className="db-row__title">
                    {x.type === "sale"
                      ? (x.items?.map(it => it.name).join(", ").slice(0, 28) || "Sotuv")
                      : (getCatLabel(x.categoryKey) + (x.title && x.title !== getCatLabel(x.categoryKey) ? ` · ${x.title}` : "")).slice(0, 28)
                    }
                  </div>
                  <div className="db-row__meta">
                    {x.type === "sale"
                      ? <><span className="db-row__who">{x.seller?.tgName || "-"}</span><span className="db-row__time">{fmtDate(x.createdAt)}</span></>
                      : <><span className="db-row__who">{x.spender?.tgName || "-"}</span><span className="db-row__time">{fmtDate(x.createdAt)}</span></>
                    }
                  </div>
                  {x.type === "sale" && x.debtTotal > 0 && (
                    <div className="db-row__debt">qarz: {toMoney(x.debtTotal)} so'm</div>
                  )}
                </div>
                <div className={`db-row__money db-row__money--${x.type}`}>
                  {x.type === "sale" ? "+" : "-"}{toMoney(x.money)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}

/* ── HELPERS ── */
function getCatLabel(key) {
  return EXP_CATS.find(c => c.key === key)?.label || key || "Boshqa";
}

function CardItem({ icon, label, value, color, loading, wide }) {
  return (
    <div className={`db-card db-card--${color}${wide ? " db-card--wide" : ""}`}>
      {loading ? (
        <>
          <span className="sk" style={{ width: 28, height: 10, borderRadius: 6 }} />
          <span className="sk" style={{ width: "70%", height: 20, borderRadius: 8, marginTop: 6 }} />
        </>
      ) : (
        <>
          <div className="db-card__label">{icon} {label}</div>
          <div className="db-card__value">{value} <span>so'm</span></div>
        </>
      )}
    </div>
  );
}
