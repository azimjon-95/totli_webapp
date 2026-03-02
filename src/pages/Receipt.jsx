import React, { useEffect, useMemo, useState } from "react";
import { apiGet } from "../hooks/api";
import "./styles/receipt.css";

function toMoney(n) {
    return Number(n || 0).toLocaleString("uz-UZ");
}
function fmtDate(d) {
    const x = new Date(d);
    const pad = (v) => String(v).padStart(2, "0");
    return `${pad(x.getDate())}.${pad(x.getMonth() + 1)}.${x.getFullYear()} ${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

export default function Receipt() {
    const token = useMemo(() => new URLSearchParams(window.location.search).get("token"), []);
    const [sale, setSale] = useState(null);
    const [err, setErr] = useState("");

    console.log("OPEN URL:", window.location.href);
    console.log("TOKEN:", token);

    useEffect(() => {
        (async () => {
            try {
                if (!token) {
                    setErr("Token topilmadi");
                    return;
                }

                // ✅ faqat /receipt
                const data = await apiGet(`/receipt?token=${encodeURIComponent(token)}`);

                setSale(data.sale);
                setSale(prev => ({ ...prev, deepLink: data.deepLink, qrDataUrl: data.qrDataUrl }));
            } catch (e) {
                setErr(e.message || "Xatolik");
            }
        })();
    }, [token]);


    const onPrint = () => {
        // Telegram ichida ham ishlaydi
        window.print();
    };



    if (err) return <div className="rc-wrap"><div className="rc-card">❌ {err}</div></div>;
    if (!sale) return <div className="rc-wrap"><div className="rc-card">Yuklanmoqda…</div></div>;

    return (
        <div className="rc-wrap">
            <div className="rc-actions no-print">
                <button className="rc-btn" onClick={onPrint}>🖨 Print</button>
            </div>

            <div className="receipt">
                <div className="r-center r-title">TOTLI</div>
                <div className="r-center r-sub">Chek</div>

                <div className="r-row">
                    <div>ID:</div>
                    <div><b>{sale.orderNo}</b></div>
                </div>
                <div className="r-row">
                    <div>Sana:</div>
                    <div>{fmtDate(sale.createdAt)}</div>
                </div>
                <div className="r-row">
                    <div>Sotuvchi:</div>
                    <div>{sale?.seller?.tgName || "-"}</div>
                </div>

                <div className="r-hr" />

                <div className="r-head">
                    <div>Mahsulot</div>
                    <div className="r-right">Narxi</div>
                    <div className="r-right">Summa</div>
                </div>

                {sale.items.map((it, idx) => {
                    const lineTotal = Number(it.qty || 0) * Number(it.price || 0);
                    return (
                        <div key={idx} className="r-item">
                            <div className="r-name">
                                <b>{it.name}</b>
                            </div>
                            <div className="r-muted">{it.qty} x {toMoney(it.price)}</div>
                            <div className="r-right">{toMoney(lineTotal)}</div>
                        </div>
                    );
                })}

                <div className="r-hr" />

                <div className="r-totals">
                    <div className="r-row">
                        <div>Jami:</div>
                        <div><b>{toMoney(sale.total)}</b></div>
                    </div>
                    <div className="r-row">
                        <div>Tushgan:</div>
                        <div><b>{toMoney(sale.paidTotal)}</b></div>
                    </div>
                    {sale.debtTotal > 0 && (
                        <div className="r-row">
                            <div>Qarz:</div>
                            <div><b>{toMoney(sale.debtTotal)}</b></div>
                        </div>
                    )}
                </div>

                <div className="r-hr" />
                <div className="bonus_QR">
                    <div className="qr-title">📲 QR skaner qiling</div>
                    <div className="qr-subtitle">Keshbekni qo‘lga kiriting</div>

                    {sale?.qrDataUrl && (
                        <img
                            src={sale.qrDataUrl}
                            alt="Bonus QR"
                            className="qr-img"
                        />
                    )}
                </div>
                <div className="r-center r-thanks">Rahmat! 😊</div>
                {/* <div className="r-center r-muted">Totli tortlari</div> */}
            </div>
        </div>
    );
}
