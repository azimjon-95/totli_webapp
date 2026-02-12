import React, { useEffect, useMemo, useState } from "react";
import { apiGet, isInTelegram } from "./hooks/api";
import { io } from "socket.io-client";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import "./app.css";

function toMoney(n) {
  return Number(n || 0).toLocaleString("uz-UZ");
}

function todayISO() {
  const d = new Date();
  const pad = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function App() {
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());

  const [cards, setCards] = useState(null);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [todayLine, setTodayLine] = useState([]);
  const [yesterdayLine, setYesterdayLine] = useState([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const blocked = useMemo(() => !isInTelegram(), []);

  async function loadAll() {
    setErr("");
    setLoading(true);
    try {
      // 1) summary cards
      const rep = await apiGet(`/api/webapp/summary?from=${from}&to=${to}`);
      setCards(rep.cards);

      // 2) today list
      const list = await apiGet(`/api/webapp/today/list`);
      setSales(list.sales || []);
      setExpenses(list.expenses || []);

      // 3) chart data (today vs yesterday hourly)
      const ch = await apiGet(`/api/webapp/chart/today-vs-yesterday`);
      setTodayLine(ch.today || []);
      setYesterdayLine(ch.yesterday || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (blocked) return;
    // Telegram UI
    window.Telegram?.WebApp?.ready();
    window.Telegram?.WebApp?.expand();
    loadAll();

    // realtime
    const s = io("/", { path: "/socket.io" });
    s.on("refresh", () => loadAll());
    return () => s.close();
    // eslint-disable-next-line
  }, []);

  if (blocked) {
    return (
      <div className="wrap">
        <div className="card">
          <div className="h">Bu mini app faqat Telegram ichida ishlaydi.</div>
          <div className="muted">Botdagi “Открыть” tugmasidan kiring.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className="top">
        <div>
          <div className="title">Totli Dashboard</div>
          <div className="muted">📊 Real-time hisobot</div>
        </div>

        <button className="btn" onClick={loadAll} disabled={loading}>
          {loading ? "Yuklanmoqda..." : "Yangilash"}
        </button>
      </div>

      <div className="range">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <button className="btn" onClick={loadAll} disabled={loading}>
          Ko‘rish
        </button>
      </div>

      {err ? <div className="err">⚠️ {err}</div> : null}

      <div className="cardsRow">
        <Card title="🧁 Jami sotuv" value={toMoney(cards?.soldTotal)} />
        <Card title="💰 Tushgan pul" value={toMoney(cards?.salePaid)} />
        <Card title="💸 Chiqim" value={toMoney(cards?.expenseSum)} />
        <Card title="👥 Mijoz qarzi" value={toMoney(cards?.customerDebt)} />
        <Card title="🏭 Firmaga qarz" value={toMoney(cards?.supplierDebt)} />
        <Card title="🏦 Balans" value={toMoney(cards?.balance)} />
      </div>

      <div className="chartBlock">
        <div className="h">Bugun vs Kecha (soatbay tushum)</div>
        <div className="chart">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart
              data={mergeLines(todayLine, yesterdayLine)}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="today" stroke="#22c55e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="yesterday" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="legend">
          <span className="dot g" /> Bugun
          <span className="dot y" /> Kecha
        </div>
      </div>

      <div className="listBlock">
        <div className="h">Bugun sotilgan / chiqimlar</div>

        <div className="list">
          {buildMixedList(sales, expenses).map((x, idx) => (
            <div key={idx} className="row">
              <div className="rowTop">
                <b>{x.title}</b>
                <span className="money">{x.money}</span>
              </div>
              <div className="muted">{x.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="card">
      <div className="k">{title}</div>
      <div className="v">{value} so'm</div>
    </div>
  );
}

// today/yesterday hour merge
function mergeLines(today, yesterday) {
  const map = new Map();
  for (const t of today || []) map.set(t.hour, { hour: t.hour, today: t.value, yesterday: 0 });
  for (const y of yesterday || []) {
    const cur = map.get(y.hour) || { hour: y.hour, today: 0, yesterday: 0 };
    cur.yesterday = y.value;
    map.set(y.hour, cur);
  }
  return Array.from(map.values()).sort((a, b) => Number(a.hour) - Number(b.hour));
}

function buildMixedList(sales, expenses) {
  const s = (sales || []).map((x) => ({
    at: new Date(x.createdAt).getTime(),
    title: `🧁 ${x.orderNo} — ${x.items?.length || 0} ta`,
    money: `${Number(x.paidTotal || 0).toLocaleString("uz-UZ")} so'm`,
    time: new Date(x.createdAt).toLocaleString("uz-UZ"),
  }));

  const e = (expenses || []).map((x) => ({
    at: new Date(x.createdAt).getTime(),
    title: `❌ ${x.orderNo} — ${x.title} (${x.categoryKey})`,
    money: `${Number(x.amount || 0).toLocaleString("uz-UZ")} so'm`,
    time: new Date(x.createdAt).toLocaleString("uz-UZ"),
  }));

  return [...s, ...e].sort((a, b) => b.at - a.at).slice(0, 40);
}
