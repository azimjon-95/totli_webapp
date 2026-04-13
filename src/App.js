// src/App.js
import React, { useEffect, useMemo, useState } from "react";
import { apiGet, isInTelegram, API_BASE } from "./hooks/api";
import { io } from "socket.io-client";
import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import "./app.css";

/* ===========================
   HELPERS
=========================== */

function toMoney(n) {
  return Number(n || 0).toLocaleString("uz-UZ");
}

function todayISO() {
  const d = new Date();
  const pad = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/* ===========================
   ISO DATE FUNCTIONS
   (Frontend UTC qilib yuboradi)
=========================== */

function toISOStartOfDay(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0)).toISOString();
}

function toISOEndOfDay(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999)).toISOString();
}

/* ===========================
   TIME FORMATTER (Asia/Tashkent)
=========================== */

const fmtTashkent = new Intl.DateTimeFormat("uz-UZ", {
  timeZone: "Asia/Tashkent",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function formatDateTashkent(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return fmtTashkent.format(d);
}

/* ===========================
   DEBOUNCE HOOK
=========================== */

function useDebounce(value, delay = 350) {
  const [v, setV] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return v;
}

/* ===========================
   APP
=========================== */

export default function App() {
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());
  const debFrom = useDebounce(from, 350);
  const debTo = useDebounce(to, 350);
  const [unauthorized, setUnauthorized] = useState(false);
  const [cards, setCards] = useState(null);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [todayLine, setTodayLine] = useState([]);
  const [yesterdayLine, setYesterdayLine] = useState([]);
  const [err, setErr] = useState("");

  // Dashboard faqat Telegram ichida yoki localhost’da ishlasin
  const blocked = useMemo(() => {
    const host = window.location.hostname;

    const isLocal =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".ngrok-free.app");


    if (unauthorized) return true;

    return !(isInTelegram() || isLocal);
  }, [unauthorized]);

  async function loadAll(customFrom, customTo) {
    setErr("");

    try {
      const _from = customFrom ?? from;
      const _to = customTo ?? to;

      const fromISO = toISOStartOfDay(_from);
      const toISO = toISOEndOfDay(_to);

      const query = `from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(
        toISO
      )}`;

      const rep = await apiGet(`/dashboard/summary?${query}`);
      setCards(rep.cards);

      const act = await apiGet(`/dashboard/activity?${query}`);
      setSales(act.sales || []);
      setExpenses(act.expenses || []);

      const ch = await apiGet(`/dashboard/chart?${query}`);
      setTodayLine(ch.today || []);
      setYesterdayLine(ch.yesterday || []);


    } catch (e) {
      const msg = e?.message || "Xatolik";

      if (
        msg.includes("UNAUTHORIZED") ||
        msg.includes("no_hash") ||
        msg.includes("401") ||
        msg.includes("FORBIDDEN") ||   // 👈 qo‘shildi
        msg.includes("403")            // 👈 qo‘shildi
      ) {
        setUnauthorized(true);
      }

      setErr(msg);
    }

    // } catch (e) {
    //   const msg = e?.message || "Xatolik";

    //   if (
    //     msg.includes("UNAUTHORIZED") ||
    //     msg.includes("no_hash") ||
    //     msg.includes("401") ||
    //     msg.includes("FORBIDDEN") ||   // 👈 qo‘shildi
    //     msg.includes("403")            // 👈 qo‘shildi
    //   ) {
    //     setUnauthorized(true);
    //   }

    //   setErr(msg);
    // }
  }

  // Telegram init + socket refresh
  useEffect(() => {
    if (blocked) return;

    if (isInTelegram()) {
      window.Telegram?.WebApp?.ready?.();
      window.Telegram?.WebApp?.expand?.();
    }

    // Birinchi load
    loadAll();

    // ✅ Socket doim cake.medme.uz (API_BASE) ga ulanadi
    const s = io(API_BASE, {
      transports: ["websocket"],
      withCredentials: true,
    });

    // Sizning serveringiz "refresh" event yuborayotgan bo‘lsa
    s.on("refresh", () => loadAll());

    // Agar server "dash:update" yuborsa ham ishlasin (ixtiyoriy)
    s.on("dash:update", () => loadAll());

    s.on("connect_error", (e) => {
      console.log("socket connect_error:", e?.message || e);
    });

    return () => s.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocked]);

  // Date o'zgarsa avtomatik loadAll
  useEffect(() => {
    if (blocked) return;

    if (debFrom && debTo && debFrom > debTo) {
      setErr("⚠️ 'From' sanasi 'To'dan katta bo'lmasin.");
      return;
    }

    loadAll(debFrom, debTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debFrom, debTo, blocked]);

  if (blocked) {
    return (
      <div className="wrap">
        <div style={{ maxWidth: 520, margin: "60px auto", textAlign: "center" }}>
          <h2>🔒 Kirish cheklangan</h2>

          <p style={{ fontSize: 16 }}>
            😔 Uzr, sizga hisobotlarni ko‘rish uchun ruxsat berilmagan.
          </p>

          <p style={{ marginTop: 10 }}>
            📩 Ruxsat olish uchun administratorga murojaat qiling:
          </p>

          <a
            href="https://t.me/Azimjon_M"
            target="_blank"
            rel="noreferrer"
            style={{ fontWeight: "bold", fontSize: 16 }}
          >
            @Azimjon_M
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className="top">
        <div>
          <div className="title">Totli Statistika</div>
          <div className="muted">📊 Jonli ma'lumotlar</div>
        </div>

        {/* <button className="btn" onClick={() => loadAll()} disabled={loading}>
          {loading ? "Yuklanmoqda..." : "Yangilash"}
        </button> */}
        <div className="range">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>


      {err ? <div className="err">⚠️ {err}</div> : null}

      <div className="cardsRow">
        <Card title="💰 Tushgan pul" value={toMoney(cards?.soldTotal)} />
        <Card title="💸 Chiqim" value={toMoney(cards?.expenseSum)} />
        <Card title="👥 Mijoz qarzi" value={toMoney(cards?.customerDebt)} />
        <Card title="🏭 Firmaga qarz" value={toMoney(cards?.supplierDebt)} />
        <Card title="🏦 Balans" value={toMoney(cards?.balance)} />
      </div>

      <div className="chartBlock">
        <div className="h">Bugun vs Kecha (soatbay tushum)</div>
        <div className="chart">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={mergeLines(todayLine, yesterdayLine)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <Tooltip />
              <Line type="monotone" dataKey="today" stroke="#22c55e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="yesterday" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="listBlock compact">
        <div className="h">Bugun sotilgan / chiqimlar</div>

        <div className="list">
          {buildMixedListFull(sales, expenses).map((x, idx) => (
            <div key={`${x.type}-${x.orderNo || idx}`} className={`row ${x.type}`}>
              <div className="rowTop">
                <b className="title">
                  {x.type === "sale"
                    ? `🧁 Sotuv #${x.orderNo || "-"}`
                    : `❌ Chiqim #${x.orderNo || "-"}`}
                </b>

                <span className="money">
                  {x.type === "expense" ? "-" : "+"}
                  {toMoney(x.money)} so'm
                </span>
              </div>

              <div className="meta">
                <span className="pill">
                  {x.type === "sale" ? "SOTUV" : "CHIQIM"}
                </span>
                <span className="time">{formatDateTashkent(x.createdAt)}</span>
              </div>

              {x.type === "sale" ? (
                <div className="details">
                  {Number(x.money) !== Number(x.total) && (
                    <div className="kv">
                      <span>Jami:</span>
                      <b>{toMoney(x.total)} so'm</b>
                    </div>
                  )}
                  <div className="kv">
                    <span>To'langan:</span>
                    <b>{toMoney(x.paidTotal)} so'm</b>
                  </div>

                  {x.debtTotal > 0 && (
                    <div className="kv">
                      <span>Qarzdorlik:</span>
                      <b>{toMoney(x.debtTotal)} so'm</b>
                    </div>
                  )}

                  <div className="kv">
                    <span>Sotuvchi:</span>
                    <b>
                      {x.seller?.tgName || "-"} ({x.seller?.tgId || "-"})
                    </b>
                  </div>

                  {x.phone && (
                    <div className="kv">
                      <span>Telefon:</span>
                      <b>{x.phone || "-"}</b>
                    </div>
                  )}

                  {x.items?.length ? (
                    <div className="items">
                      {x.items.map((it, i) => (
                        <div key={i} className="itemRow">
                          <span className="muted">{it.name}</span>
                          <span className="muted">x{it.qty}</span>
                          <span className="muted">{toMoney(it.price)} so'm</span>
                          <b>{toMoney(it.paid)} so'm</b>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="details">
                  <div className="kv">
                    <span>Title:</span>
                    <b>{x.title || "-"}</b>
                  </div>
                  <div className="kv">
                    <span>Summa:</span>
                    <b>{toMoney(x.amount)} so'm</b>
                  </div>
                  <div className="kv">
                    <span>Kategoriya:</span>
                    <b>{x.categoryKey || "-"}</b>
                  </div>
                  <div className="kv">
                    <span>Izoh:</span>
                    <b>{x.description || "-"}</b>
                  </div>
                  <div className="kv">
                    <span>Xarajat qiluvchi:</span>
                    <b>
                      {x.spender?.tgName || "-"} ({x.spender?.tgId || "-"})
                    </b>
                  </div>
                  <div className="kv">
                    <span>Supplier:</span>
                    <b>{x.supplierId || "-"}</b>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===========================
   COMPONENTS
=========================== */

function Card({ title, value }) {
  return (
    <div className="card">
      <div className="k">{title}</div>
      <div className="v">{value} so'm</div>
    </div>
  );
}

/* ===========================
   CHART HELPERS
=========================== */

function mergeLines(today, yesterday) {
  const map = new Map();

  for (const t of today || []) {
    map.set(t.hour, { hour: t.hour, today: t.value, yesterday: 0 });
  }

  for (const y of yesterday || []) {
    const cur = map.get(y.hour) || { hour: y.hour, today: 0, yesterday: 0 };
    cur.yesterday = y.value;
    map.set(y.hour, cur);
  }

  return Array.from(map.values()).sort((a, b) => Number(a.hour) - Number(b.hour));
}

/* ===========================
   MIXED LIST (FULL INFO)
=========================== */

function buildMixedListFull(sales = [], expenses = []) {
  const s = sales.map((o) => ({
    type: "sale",
    at: new Date(o.createdAt).getTime(),
    createdAt: o.createdAt,
    orderNo: o.orderNo,
    money: o.paidTotal ?? o.total ?? 0,
    total: o.total,
    paidTotal: o.paidTotal,
    debtTotal: o.debtTotal,
    phone: o.phone,
    seller: o.seller,
    items: o.items || [],
    raw: o,
  }));

  const e = expenses.map((x) => ({
    type: "expense",
    at: new Date(x.createdAt).getTime(),
    createdAt: x.createdAt,
    orderNo: x.orderNo,
    money: x.amount ?? 0,
    amount: x.amount,
    categoryKey: x.categoryKey,
    description: x.description,
    spender: x.spender,
    supplierId: x.supplierId,
    title: x.title,
    raw: x,
  }));

  return [...s, ...e].sort((a, b) => b.at - a.at).slice(0, 40);
}