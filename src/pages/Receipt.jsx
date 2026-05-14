import React,{useEffect,useState,useCallback} from "react";
import {apiGet} from "../hooks/api";
import "../pages/styles/receipt.css";
import "../global.css";

function fmt(n){return Number(n||0).toLocaleString("uz-UZ");}

const fmtDt=new Intl.DateTimeFormat("uz-UZ",{timeZone:"Asia/Tashkent",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});

export default function Receipt(){
  const id=new URLSearchParams(window.location.search).get("id");
  const [data,setData]=useState(null);
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    if(!id){setErr("Chek ID topilmadi");setLoading(false);return;}
    apiGet(`/sale/${id}`)
      .then(d=>setData(d))
      .catch(e=>setErr(e?.message||"Xatolik"))
      .finally(()=>setLoading(false));
  },[id]);

  const print=useCallback(()=>window.print(),[]);

  if(loading) return<div className="rc-wrap"><div className="rc-loading">⏳ Yuklanmoqda...</div></div>;
  if(err)     return<div className="rc-wrap"><div className="rc-err">❌ {err}</div></div>;
  if(!data)   return<div className="rc-wrap"><div className="rc-err">Chek topilmadi</div></div>;

  const sale=data.sale||data;
  const items=sale.items||[];
  const dt=sale.createdAt?fmtDt.format(new Date(sale.createdAt)):"—";

  return(
    <div className="rc-wrap">
      <div className="rc-paper">
        {/* HEADER */}
        <div className="rc-head">
          <div className="rc-logo">🎂</div>
          <div className="rc-shop">TOTLI TORTLAR</div>
          <div className="rc-addr">Iltimos qayta keling!</div>
        </div>

        <div className="rc-divider"/>

        {/* META */}
        <div className="rc-meta">
          <div className="rc-meta__row">
            <span>Chek №</span>
            <span className="rc-meta__val">#{sale.orderNo||"—"}</span>
          </div>
          <div className="rc-meta__row">
            <span>Sana</span>
            <span className="rc-meta__val">{dt}</span>
          </div>
          <div className="rc-meta__row">
            <span>Kassir</span>
            <span className="rc-meta__val">{sale.seller?.tgName||"—"}</span>
          </div>
          {sale.phone&&(
            <div className="rc-meta__row">
              <span>Tel</span>
              <span className="rc-meta__val">{sale.phone}</span>
            </div>
          )}
        </div>

        <div className="rc-divider rc-divider--dashed"/>

        {/* ITEMS */}
        <div className="rc-items">
          <div className="rc-items__head">
            <span>Mahsulot</span>
            <span>Soni</span>
            <span>Narx</span>
            <span>Jami</span>
          </div>
          {items.map((it,i)=>{
            const qty=Number(it.qty||1);
            const price=Number(it.price||0);
            return(
              <div key={i} className="rc-item">
                <span className="rc-item__name">{it.name||"—"}</span>
                <span className="rc-item__qty">{qty}</span>
                <span className="rc-item__price">{fmt(price)}</span>
                <span className="rc-item__total">{fmt(qty*price)}</span>
              </div>
            );
          })}
        </div>

        <div className="rc-divider"/>

        {/* TOTALS */}
        <div className="rc-totals">
          <div className="rc-total__row">
            <span>Jami</span>
            <span>{fmt(sale.total)} so'm</span>
          </div>
          {Number(sale.debtTotal)>0&&(
            <div className="rc-total__row rc-total__row--debt">
              <span>Qarz</span>
              <span>{fmt(sale.debtTotal)} so'm</span>
            </div>
          )}
          {Number(sale.change||0)>0&&(
            <div className="rc-total__row">
              <span>Qaytim</span>
              <span>{fmt(sale.change)} so'm</span>
            </div>
          )}
          <div className="rc-total__row rc-total__row--paid">
            <span>To'landi</span>
            <span>{fmt(sale.paidTotal)} so'm</span>
          </div>
        </div>

        <div className="rc-divider"/>

        {/* FOOTER */}
        <div className="rc-foot">
          <div className="rc-foot__thanks">Xaridingiz uchun rahmat! 🙏</div>
          <div className="rc-foot__bonus">10% cashback bonus botda</div>
          <div className="rc-foot__bot">@totlisang_bot</div>
        </div>

        {/* PRINT BUTTON — screen only */}
        <button className="rc-print-btn no-print" onClick={print}>🖨 Chop etish</button>
      </div>
    </div>
  );
}
