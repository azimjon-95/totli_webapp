import React,{useState} from "react";

function fmt(n){return Number(n||0).toLocaleString("uz-UZ");}

export default function ShareTab({loading,me,tgUser,ref:refData,botUsername}){
  const [copied,setCopied]=useState(false);
  const tgId=me?.tgId||tgUser?.id;
  const link=tgId?`https://t.me/${botUsername||"totlisang_bot"}?start=ref${tgId}`:"";

  function copyLink(){
    if(!link) return;
    navigator.clipboard?.writeText(link).then(()=>{
      setCopied(true); setTimeout(()=>setCopied(false),2000);
    });
  }

  function shareLink(){
    if(!link) return;
    const text=`🎂 Totli tortlar — yoqimli va sifatli!\n\nHar sotuvdan 10% cashback yutib oling:\n${link}`;
    const tg=window.Telegram?.WebApp;
    if(tg?.openTelegramLink){tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);}
    else{window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);}
  }

  const refCount=refData?.count||0;
  const refEarned=refData?.earned||0;

  const STEPS=[
    {icon:"🔗",title:"Havolani ulashing",desc:"Pastdagi tugma orqali do'stlarga yuboring"},
    {icon:"🛍",title:"Do'stingiz xarid qiladi",desc:"U botdan xarid qilsa, siz ham undirasiz"},
    {icon:"🪙",title:"Bonus oling",desc:"Har tavsiya uchun 500 so'm bonus"},
  ];

  return(
    <div className="cw-tab">
      {/* HERO */}
      <div className="shr-hero">
        <div className="shr-hero__emoji">🎁</div>
        <div className="shr-hero__title">Do'stlaringizni taklif qiling</div>
        <div className="shr-hero__sub">Har bir tavsiya uchun <b style={{color:"var(--gold)"}}>500 so'm</b> bonus</div>
      </div>

      {/* STATS */}
      {!loading&&(
        <div className="shr-stats fadeUp">
          <div className="shr-stat">
            <div className="shr-stat__val">{refCount}</div>
            <div className="shr-stat__label">Do'stlar</div>
          </div>
          <div className="shr-stat__div"/>
          <div className="shr-stat">
            <div className="shr-stat__val" style={{color:"var(--gold)"}}>{fmt(refEarned)}</div>
            <div className="shr-stat__label">so'm topildi</div>
          </div>
        </div>
      )}

      {/* LINK */}
      <div className="shr-link-wrap">
        <div className="shr-link-box">
          <span className="shr-link-text">{link||"Yuklanmoqda..."}</span>
        </div>
        <button className={`shr-copy${copied?" is-copied":""}`} onClick={copyLink} disabled={!link}>
          {copied?"✓":"📋"}
        </button>
      </div>

      {/* SHARE BTN */}
      <button className="shr-btn" onClick={shareLink} disabled={!link}>
        <span>📲</span> Telegram orqali ulashish
      </button>

      {/* STEPS */}
      <div className="shr-steps">
        <div className="shr-steps__title">Qanday ishlaydi?</div>
        {STEPS.map((s,i)=>(
          <div key={i} className="shr-step fadeUp" style={{animationDelay:`${i*0.1}s`}}>
            <div className="shr-step__num">{s.icon}</div>
            <div className="shr-step__body">
              <div className="shr-step__title">{s.title}</div>
              <div className="shr-step__desc">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
