import React,{useState} from "react";

function fmt(n){return Number(n||0).toLocaleString("uz-UZ");}

const CATS=[
  {key:"all",    label:"Barchasi", icon:"✨"},
  {key:"tort",   label:"Tortlar",  icon:"🎂"},
  {key:"peroj",  label:"Perojiolar",icon:"🧁"},
  {key:"drink",  label:"Ichimlik", icon:"🥤"},
  {key:"aks",    label:"Aksessuar",icon:"📦"},
];

const ITEMS=[
  {id:1,cat:"tort", name:"Biskvit tort",    desc:"Krem bilan, kg", price:140000, emoji:"🎂",  badge:"Bestseller"},
  {id:2,cat:"tort", name:"Shokoladli tort", desc:"Belgiyalik shok.", price:160000, emoji:"🍫"},
  {id:3,cat:"tort", name:"Bento tort",      desc:"Mini, 1 kishilik", price:70000, emoji:"🍱", badge:"Hit"},
  {id:4,cat:"tort", name:"Mevali tort",     desc:"Tabiiy mevalar",  price:155000, emoji:"🍓"},
  {id:5,cat:"peroj",name:"Eclair",          desc:"Krem bilan", price:12000,  emoji:"🥐"},
  {id:6,cat:"peroj",name:"Pirojnoe",        desc:"Assortiy",   price:10000,  emoji:"🧁",  badge:"Yangi"},
  {id:7,cat:"peroj",name:"Cheesecake",      desc:"Original",   price:22000,  emoji:"🍰"},
  {id:8,cat:"peroj",name:"Tiramisu",        desc:"Italyancha", price:25000,  emoji:"☕"},
  {id:9,cat:"drink",name:"Pepsi",           desc:"0.5 litr",   price:8000,   emoji:"🥤"},
  {id:10,cat:"drink",name:"Fanta",          desc:"0.5 litr",   price:8000,   emoji:"🍊"},
  {id:11,cat:"drink",name:"Sprite",         desc:"0.5 litr",   price:8000,   emoji:"💧"},
  {id:12,cat:"aks",  name:"Shisha",         desc:"Shirinsiz",  price:35000,  emoji:"🏺"},
  {id:13,cat:"aks",  name:"Tort quticha",   desc:"Yoqimli",    price:15000,  emoji:"📦"},
];

export default function CatalogTab({tgUser}){
  const [cat,setCat]=useState("all");
  const [search,setSearch]=useState("");
  const [basket,setBasket]=useState({}); // {id: qty}
  const [sent,setSent]=useState(false);

  const filtered=ITEMS.filter(x=>{
    const catOk = cat==="all" || x.cat===cat;
    const sOk   = !search || x.name.toLowerCase().includes(search.toLowerCase());
    return catOk&&sOk;
  });

  function add(id){setBasket(b=>({...b,[id]:(b[id]||0)+1}));}
  function rem(id){setBasket(b=>{const n={...b};if(n[id]>1)n[id]--;else delete n[id];return n;});}

  const totalCount=Object.values(basket).reduce((a,b)=>a+b,0);
  const totalSum=Object.entries(basket).reduce((s,[id,q])=>{
    const item=ITEMS.find(x=>x.id===Number(id));
    return s+(item?item.price*q:0);
  },0);

  function sendOrder(){
    const lines=Object.entries(basket).map(([id,q])=>{
      const it=ITEMS.find(x=>x.id===Number(id));
      return it?`${it.emoji} ${it.name} × ${q} — ${fmt(it.price*q)} so'm`:"";
    }).filter(Boolean).join("\n");
    const text=`🛍 Zakaz:\n${lines}\n\n💰 Jami: ${fmt(totalSum)} so'm\n👤 ${tgUser?.first_name||"Mijoz"} (@${tgUser?.username||"—"})`;
    const tg=window.Telegram?.WebApp;
    if(tg?.sendData){tg.sendData(JSON.stringify({type:"catalog_order",lines,totalSum,tgUser}));}
    else{ window.open(`https://t.me/totlisang_bot?start=order&text=${encodeURIComponent(text)}`); }
    setSent(true);
    setBasket({});
    setTimeout(()=>setSent(false),3500);
  }

  return(
    <div className="cw-tab" style={{paddingBottom: totalCount>0?120:14}}>
      {/* HEADER */}
      <div className="cat-header">
        <div className="cat-header__title">🎂 Katalog</div>
        <div className="cat-header__sub">Buyurtma bering, yetkazib beramiz</div>
      </div>

      {/* SEARCH */}
      <div className="cat-search-wrap">
        <span className="cat-search__icon">🔍</span>
        <input
          className="cat-search"
          placeholder="Qidirish..."
          value={search}
          onChange={e=>setSearch(e.target.value)}
        />
        {search&&<button className="cat-search__clear" onClick={()=>setSearch("")}>✕</button>}
      </div>

      {/* CATEGORY PILLS */}
      <div className="cat-pills">
        {CATS.map(c=>(
          <button key={c.key} className={`cat-pill${cat===c.key?" is-on":""}`} onClick={()=>setCat(c.key)}>
            <span>{c.icon}</span> {c.label}
          </button>
        ))}
      </div>

      {/* GRID */}
      <div className="cat-grid">
        {filtered.length===0&&(
          <div className="cat-empty">Hech narsa topilmadi 🤷</div>
        )}
        {filtered.map((item,i)=>{
          const qty=basket[item.id]||0;
          return(
            <div key={item.id} className="cat-card fadeUp" style={{animationDelay:`${i*0.04}s`}}>
              {item.badge&&<div className="cat-card__badge">{item.badge}</div>}
              <div className="cat-card__emoji">{item.emoji}</div>
              <div className="cat-card__name">{item.name}</div>
              <div className="cat-card__desc">{item.desc}</div>
              <div className="cat-card__price">{fmt(item.price)} <span>so'm</span></div>
              <div className="cat-card__ctrl">
                {qty===0?(
                  <button className="cat-btn-add" onClick={()=>add(item.id)}>+ Qo'sh</button>
                ):(
                  <div className="cat-counter">
                    <button className="cat-counter__btn" onClick={()=>rem(item.id)}>−</button>
                    <span className="cat-counter__val">{qty}</span>
                    <button className="cat-counter__btn" onClick={()=>add(item.id)}>+</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* BASKET BAR */}
      {totalCount>0&&!sent&&(
        <div className="cat-basket fadeUp">
          <div className="cat-basket__info">
            <span className="cat-basket__count">{totalCount} ta mahsulot</span>
            <span className="cat-basket__sum">{fmt(totalSum)} so'm</span>
          </div>
          <button className="cat-basket__btn" onClick={sendOrder}>
            📲 Zakaz berish
          </button>
        </div>
      )}

      {sent&&(
        <div className="cat-sent fadeUp">✅ Zakaz yuborildi! Tez orada bog'lanamiz.</div>
      )}
    </div>
  );
}
