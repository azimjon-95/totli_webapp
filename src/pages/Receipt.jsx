import React, { useEffect, useState, useCallback, useRef } from "react";
import "./styles/receipt.css";
import "../global.css";

function fmt(n) { return Number(n || 0).toLocaleString("uz-UZ"); }

const fmtDt = new Intl.DateTimeFormat("uz-UZ", {
  timeZone: "Asia/Tashkent",
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit"
});

const API_BASE = "https://cake.medme.uz";

export default function Receipt() {
  const token = new URLSearchParams(window.location.search).get("token");
  const [data, setData]     = useState(null);
  const [err, setErr]       = useState("");
  const [loading, setLoad]  = useState(true);
  const [printed, setPrinted] = useState(false);
  const tickRef = useRef(null);

  useEffect(() => {
    if (!token) { setErr("Chek topilmadi"); setLoad(false); return; }
    fetch(`${API_BASE}/api/webapp/receipt?token=${token}`)
      .then(r => r.json())
      .then(j => {
        if (!j.ok) throw new Error(j.error || "Xatolik");
        setData(j.data);
      })
      .catch(e => setErr(e.message))
      .finally(() => setLoad(false));
  }, [token]);

  // Confetti animation on mount
  useEffect(() => {
    if (!data) return;
    const canvas = document.getElementById("rc-confetti");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = 180;
    const pieces = Array.from({ length: 38 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -80,
      r: Math.random() * 5 + 3,
      d: Math.random() * 2 + 1,
      color: ["#f7c948","#ff6b9d","#43d9a2","#5b8af7","#ff9f43"][Math.floor(Math.random()*5)],
      tilt: Math.random() * 10 - 5,
    }));
    let frame = 0;
    const max = 90;
    function draw() {
      if (frame++ > max) { ctx.clearRect(0,0,canvas.width,canvas.height); return; }
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pieces.forEach(p => {
        p.y += p.d; p.tilt += 0.1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 2*Math.PI);
        ctx.fillStyle = p.color;
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }
    draw();
  }, [data]);

  const handlePrint = useCallback(() => {
    setPrinted(true);
    setTimeout(() => window.print(), 100);
  }, []);

  if (loading) return (
    <div className="rc-wrap">
      <div className="rc-skeleton">
        <div className="rc-skel-logo"/>
        <div className="rc-skel-line w80"/>
        <div className="rc-skel-line w50"/>
        <div className="rc-skel-line w90"/>
        <div className="rc-skel-line w60"/>
        <div className="rc-skel-line w70"/>
      </div>
    </div>
  );

  if (err) return (
    <div className="rc-wrap">
      <div className="rc-err-box">
        <div className="rc-err-icon">⚠️</div>
        <div className="rc-err-text">{err}</div>
      </div>
    </div>
  );

  if (!data) return null;

  const { sale, qrDataUrl, deepLink, minPaid } = data;
  const items   = sale.items || [];
  const dt      = sale.createdAt ? fmtDt.format(new Date(sale.createdAt)) : "—";
  const hasDebt = Number(sale.debtTotal) > 0;
  const hasChange = Number(sale.change || 0) > 0;
  const cashback = Math.floor(Number(sale.paidTotal || 0) * 0.10);
  const showQr  = !!qrDataUrl && Number(sale.paidTotal || 0) >= Number(minPaid || 0);

  return (
    <div className="rc-wrap">
      <canvas id="rc-confetti" className="rc-confetti no-print"/>

      <div className="rc-paper">

        {/* ── HEADER ── */}
        <div className="rc-head">
          <div className="rc-head-glow"/>
          <div className="rc-logo-wrap">
            <span className="rc-logo-emoji">🎂</span>
          </div>
          <div className="rc-shop-name">TOTLI TORTLAR</div>
          <div className="rc-shop-addr">📍 Sang'sentir, Anhor minosi</div>
          <div className="rc-shop-phone">📞 +998 77 737 77 40</div>
        </div>

        {/* ── DIVIDER ── */}
        <div className="rc-cut">
          <div className="rc-cut-circle rc-cut-circle--left"/>
          <div className="rc-cut-line"/>
          <div className="rc-cut-circle rc-cut-circle--right"/>
        </div>

        {/* ── META ── */}
        <div className="rc-meta">
          <div className="rc-meta-row">
            <span className="rc-meta-label">Chek №</span>
            <span className="rc-meta-val mono">#{sale.orderNo || "—"}</span>
          </div>
          <div className="rc-meta-row">
            <span className="rc-meta-label">Sana</span>
            <span className="rc-meta-val mono">{dt}</span>
          </div>
          <div className="rc-meta-row">
            <span className="rc-meta-label">Kassir</span>
            <span className="rc-meta-val">{sale.seller?.tgName || "—"}</span>
          </div>
          {sale.phone && (
            <div className="rc-meta-row">
              <span className="rc-meta-label">Mijoz tel</span>
              <span className="rc-meta-val mono">{sale.phone}</span>
            </div>
          )}
        </div>

        {/* ── ITEMS ── */}
        <div className="rc-items-wrap">
          <div className="rc-items-head">
            <span>Mahsulot</span>
            <span>Son</span>
            <span>Narx</span>
            <span>Jami</span>
          </div>
          {items.map((it, i) => {
            const qty   = Number(it.qty || 1);
            const price = Number(it.price || 0);
            return (
              <div key={i} className="rc-item">
                <span className="rc-item-name">{it.name || "—"}</span>
                <span className="rc-item-qty">{qty}</span>
                <span className="rc-item-price mono">{fmt(price)}</span>
                <span className="rc-item-total mono">{fmt(qty * price)}</span>
              </div>
            );
          })}
        </div>

        {/* ── TOTALS ── */}
        <div className="rc-totals">
          <div className="rc-total-row">
            <span>Jami summa</span>
            <span className="mono">{fmt(sale.total)} so'm</span>
          </div>
          {hasDebt && (
            <div className="rc-total-row rc-debt">
              <span>⚠️ Qarz</span>
              <span className="mono">{fmt(sale.debtTotal)} so'm</span>
            </div>
          )}
          {hasChange && (
            <div className="rc-total-row rc-change">
              <span>↩ Qaytim</span>
              <span className="mono">{fmt(sale.change)} so'm</span>
            </div>
          )}
          <div className="rc-total-row rc-paid">
            <span>✅ To'landi</span>
            <span className="mono">{fmt(sale.paidTotal)} so'm</span>
          </div>
        </div>

        {/* ── CASHBACK QR ── */}
        {showQr && (
          <div className="rc-cashback">
            <div className="rc-cashback-badge">
              <span className="rc-cashback-pct">10%</span>
              <span className="rc-cashback-label">Cashback</span>
            </div>
            <div className="rc-cashback-amount">
              +{fmt(cashback)} ball
            </div>
            <div className="rc-qr-wrap">
              <img src={qrDataUrl} alt="QR" className="rc-qr-img"/>
            </div>
            <div className="rc-qr-hint">
              Ushbu QR kodni skaner qiling<br/>
              <strong>{fmt(cashback)} so'm</strong> cashback olasiz 🎁
            </div>
            {deepLink && (
              <a href={deepLink} className="rc-tg-btn no-print">
                <span>Telegram orqali olish</span>
                <span className="rc-tg-arrow">→</span>
              </a>
            )}
          </div>
        )}

        {/* ── CUT ── */}
        <div className="rc-cut rc-cut--bottom">
          <div className="rc-cut-circle rc-cut-circle--left"/>
          <div className="rc-cut-line"/>
          <div className="rc-cut-circle rc-cut-circle--right"/>
        </div>

        {/* ── FOOTER ── */}
        <div className="rc-foot">
          <div className="rc-foot-thanks">Xaridingiz uchun rahmat! 🙏</div>
          <div className="rc-foot-info">Qayta keling, doimo xush kelibsiz</div>
          <div className="rc-foot-tg">@totli_tortlari</div>
          <div className="rc-foot-map">🗺 maps.app.goo.gl/aX7c62z9kNTQYBEu5</div>
        </div>

        {/* ── PRINT BTN ── */}
        <button className="rc-print-btn no-print" onClick={handlePrint}>
          <span>🖨</span> Chop etish
        </button>

      </div>
    </div>
  );
}
