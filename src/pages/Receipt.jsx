// Receipt.jsx — 58mm Bluetooth termal printer + avtomatik chop etish
import React, { useEffect, useState, useCallback } from "react";
import "./styles/receipt.css";

const API_BASE = "https://cake.medme.uz";
const SHOP = {
  name:  "TOTLI TORTLAR",
  addr:  "Sang'sentir, Anhor minosi",
  phone: "+998 77 737 77 40",
  tg:    "@totli_tortlari",
};

function fmt(n) {
  return Number(n || 0).toLocaleString("uz-UZ");
}
function fmtDate(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("uz-UZ", {
    timeZone: "Asia/Tashkent",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

export default function Receipt() {
  const params  = new URLSearchParams(window.location.search);
  const token   = params.get("token");
  // ?auto=1 bo'lsa — chek yuklanishi bilan avtomatik chop etadi
  const autoPrint = params.get("auto") === "1";

  const [data,    setData]    = useState(null);
  const [err,     setErr]     = useState("");
  const [loading, setLoading] = useState(true);
  const [status,  setStatus]  = useState(""); // "printing" | "done"

  // ── Ma'lumotlarni yuklash ──────────────────────────
  useEffect(() => {
    if (!token) { setErr("Chek topilmadi"); setLoading(false); return; }
    fetch(`${API_BASE}/api/webapp/receipt?token=${token}`)
      .then(r => r.json())
      .then(j => {
        if (!j.ok) throw new Error(j.error || "Xatolik");
        setData(j.data);
      })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  // ── Avtomatik chop (auto=1) ────────────────────────
  useEffect(() => {
    if (!data || !autoPrint) return;
    // 400ms kutamiz — DOM to'liq render bo'lsin
    const t = setTimeout(() => doPrint(), 400);
    return () => clearTimeout(t);
  }, [data, autoPrint]);

  // ── Chop etish funksiyasi ──────────────────────────
  const doPrint = useCallback(() => {
    setStatus("printing");
    // Telegram WebApp ni yopmaymiz — faqat print dialog
    setTimeout(() => {
      window.print();
      setStatus("done");
    }, 80);
  }, []);

  // ── Holatlar ──────────────────────────────────────
  if (loading) return <div className="rp-center"><div className="rp-spin"/></div>;
  if (err)     return <div className="rp-center rp-err">⚠️ {err}</div>;
  if (!data)   return null;

  const { sale, qrDataUrl, deepLink, minPaid } = data;
  const items    = sale.items || [];
  const hasDebt  = Number(sale.debtTotal)   > 0;
  const hasChng  = Number(sale.change || 0) > 0;
  const cashback = Math.floor(Number(sale.paidTotal || 0) * 0.10);
  const showQr   = !!qrDataUrl && Number(sale.paidTotal || 0) >= Number(minPaid || 0);

  return (
    <div className="rp-wrap">

      {/* ════ PRINTER CHEK — 58mm ════ */}
      <div className="rp-receipt" id="rp-receipt">

        {/* HEADER */}
        <div className="rp-head">
          <div className="rp-logo">🎂</div>
          <div className="rp-shop">{SHOP.name}</div>
          <div className="rp-sub">{SHOP.addr}</div>
          <div className="rp-sub">{SHOP.phone}</div>
        </div>

        <div className="rp-dash"/>

        {/* META */}
        <div className="rp-meta">
          <Row l="Chek №"  r={`#${sale.orderNo || "—"}`} mono />
          <Row l="Sana"    r={fmtDate(sale.createdAt)} mono />
          <Row l="Kassir"  r={sale.seller?.tgName || "—"} />
          {sale.phone && <Row l="Tel" r={sale.phone} mono />}
        </div>

        <div className="rp-dash"/>

        {/* ITEMS */}
        <table className="rp-table">
          <thead>
            <tr>
              <th className="al">Mahsulot</th>
              <th>Son</th>
              <th>Narx</th>
              <th className="ar">Jami</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => {
              const qty   = Number(it.qty   || 1);
              const price = Number(it.price || 0);
              return (
                <tr key={i}>
                  <td className="al td-name">{it.name || "—"}</td>
                  <td className="ac">{qty}</td>
                  <td className="ar mono">{fmt(price)}</td>
                  <td className="ar mono bold">{fmt(qty * price)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="rp-line"/>

        {/* TOTALS */}
        <div className="rp-totals">
          <Row l="Jami"     r={`${fmt(sale.total)} so'm`} mono />
          {hasDebt && <Row l="Qarz ⚠️"  r={`${fmt(sale.debtTotal)} so'm`} mono cls="red" />}
          {hasChng && <Row l="Qaytim ↩" r={`${fmt(sale.change)} so'm`}   mono cls="blue" />}
        </div>
        <div className="rp-paid-row">
          <span>TO'LANDI</span>
          <span className="mono">{fmt(sale.paidTotal)} so'm</span>
        </div>

        {/* CASHBACK QR */}
        {showQr && (
          <>
            <div className="rp-dash"/>
            <div className="rp-qr-block">
              <div className="rp-qr-title">🎁 CASHBACK — 10%</div>
              <div className="rp-qr-amount">+{fmt(cashback)} ball</div>
              <img src={qrDataUrl} alt="QR" className="rp-qr-img"/>
              <div className="rp-qr-hint">
                Shu QR ni skaner qiling<br/>
                <b>{fmt(cashback)} so'm</b> cashback olasiz
              </div>
              <div className="rp-qr-bot">{SHOP.tg}</div>
            </div>
          </>
        )}

        <div className="rp-dash"/>

        {/* FOOTER */}
        <div className="rp-foot">
          <div className="rp-thanks">Xaridingiz uchun rahmat!</div>
          <div className="rp-sub">Qayta keling 🙏</div>
          <div className="rp-sub">{SHOP.tg}</div>
        </div>

        {/* ── STAR line ── */}
        <div className="rp-stars">★ ★ ★ ★ ★</div>

      </div>

      {/* ════ SCREEN ONLY BUTTONS ════ */}
      <div className="rp-actions no-print">
        <button className="rp-btn rp-btn--print" onClick={doPrint}>
          {status === "printing" ? "⏳ Chop etilmoqda..." : "🖨 Chop etish"}
        </button>
        {showQr && deepLink && (
          <a href={deepLink} className="rp-btn rp-btn--tg">
            📲 Telegram — cashback olish
          </a>
        )}
        {status === "done" && (
          <div className="rp-done">✅ Chek printerga yuborildi</div>
        )}
      </div>

    </div>
  );
}

function Row({ l, r, mono, cls }) {
  return (
    <div className={`rp-row ${cls || ""}`}>
      <span>{l}</span>
      <span className={mono ? "mono" : ""}>{r}</span>
    </div>
  );
}
