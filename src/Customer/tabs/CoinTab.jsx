import React,{useState,useEffect,useRef} from "react";

function fmt(n){return Number(n||0).toLocaleString("uz-UZ");}

const ITEMS=[
  {id:"skin1", cost:200, label:"Oltin fon",    icon:"🌟", type:"skin"},
  {id:"skin2", cost:350, label:"Neon border",  icon:"💜", type:"skin"},
  {id:"skin3", cost:500, label:"Diamond frame",icon:"💎", type:"skin"},
  {id:"boost1",cost:100, label:"2x bonus",     icon:"🚀", type:"boost",desc:"24 soat"},
  {id:"boost2",cost:250, label:"Cashback +5%", icon:"💰", type:"boost",desc:"Bir sotuv"},
];

const FRUITS=["🍓","🍋","🍇","🍒","🍊","🍌","🍑","🥝"];

export default function CoinTab({loading, me}){
  const [coins, setCoins] = useState(0);
  const [owned, setOwned] = useState([]); // unlocked items
  const [active, setActive] = useState(null); // active skin
  const [spin,   setSpin]   = useState(null); // null | "spinning" | result
  const [spinRes,setSpinRes]= useState(null);
  const [spinCost]=useState(20);
  const slotRef = useRef(null);

  // Sync coins with me.points (1 som = 0.01 coin)
  useEffect(()=>{
    const pts = Number(me?.points||0);
    setCoins(Math.floor(pts/100));
  },[me]);

  /* ── TAP GAME ── */
  const [tapCount, setTapCount]= useState(0);
  const [popups,   setPopups]  = useState([]);
  const tapBase = useRef(0);
  const dailyRef = useRef(Date.now());
  const DAILY_LIMIT = 100;

  function handleTap(e){
    if(tapBase.current>=DAILY_LIMIT) return;
    tapBase.current++;
    const gained=1;
    setTapCount(c=>c+1);
    setCoins(c=>c+gained);

    // popup
    const r={id:Date.now()+Math.random(), x:Math.random()*60+20, y:Math.random()*40+10};
    setPopups(p=>[...p.slice(-6),r]);
    setTimeout(()=>setPopups(p=>p.filter(x=>x.id!==r.id)),900);
  }

  /* ── SLOT ── */
  function doSpin(){
    if(coins<spinCost){return;}
    setCoins(c=>c-spinCost);
    setSpin("spinning");
    setSpinRes(null);
    setTimeout(()=>{
      const won=Math.random()<0.35;
      const reward=won?Math.floor(Math.random()*80+20):0;
      setSpinRes({won,reward});
      if(won) setCoins(c=>c+reward);
      setSpin("done");
    },1200);
  }

  /* ── SHOP ── */
  function buy(item){
    if(coins<item.cost||owned.includes(item.id)) return;
    setCoins(c=>c-item.cost);
    setOwned(o=>[...o,item.id]);
    if(item.type==="skin") setActive(item.id);
  }

  const dailyLeft=Math.max(0,DAILY_LIMIT-tapBase.current);

  return(
    <div className="cw-tab">
      {/* COIN HEADER */}
      <div className="coin-hdr">
        <div className="coin-hdr__label">Coin balans</div>
        <div className="coin-hdr__val">🪙 {fmt(coins)}</div>
        <div className="coin-hdr__sub">Har 100 so'm bonusdan = 1 coin</div>
      </div>

      {/* TAP ZONE */}
      <div className="coin-section">
        <div className="coin-section__title">👆 Tap qiling — coin yutib oling</div>
        <div className="coin-tap-wrap">
          <button className={`coin-tap${active?" coin-tap--"+active:""}`} onClick={handleTap} disabled={dailyLeft===0}>
            <span className="coin-tap__icon">🪙</span>
            <span className="coin-tap__glow"/>
          </button>
          {popups.map(p=>(
            <div key={p.id} className="coin-popup" style={{left:`${p.x}%`,top:`${p.y}%`}}>+1</div>
          ))}
        </div>
        <div className="coin-tap-stats">
          <span>Bugun: <b style={{color:"var(--gold)"}}>{tapCount}</b> marta</span>
          <span>Qoldi: <b style={{color:"var(--green)"}}>{dailyLeft}</b></span>
        </div>
      </div>

      {/* SLOT */}
      <div className="coin-section">
        <div className="coin-section__title">🎰 Fortuna g'ildiragi</div>
        <div className="coin-slot-wrap">
          {spin==="spinning"&&(
            <div className="coin-slot-spin">
              {[0,1,2].map(i=>(
                <div key={i} className="coin-slot-reel">
                  {[...Array(6)].map((_,j)=>(
                    <div key={j} className="coin-slot-item">{FRUITS[(i*2+j)%FRUITS.length]}</div>
                  ))}
                </div>
              ))}
            </div>
          )}
          {spin!=="spinning"&&(
            <button className={`coin-slot-btn${coins<spinCost?" is-disabled":""}`} onClick={doSpin}>
              🎰 <span>Aylantirish</span> <span className="coin-slot-cost">−{spinCost} 🪙</span>
            </button>
          )}
          {spin==="done"&&spinRes&&(
            <div className={`coin-slot-result${spinRes.won?" is-win":""}`}>
              {spinRes.won?`🎉 +${spinRes.reward} coin yutdingiz!`:"😔 Omad kelmadi, qayta urinib ko'ring"}
            </div>
          )}
        </div>
      </div>

      {/* SHOP */}
      <div className="coin-section">
        <div className="coin-section__title">🛍 Coin do'kon</div>
        <div className="coin-shop">
          {ITEMS.map(item=>{
            const isOwned=owned.includes(item.id);
            const canBuy=coins>=item.cost&&!isOwned;
            return(
              <div key={item.id} className={`coin-shop-item${isOwned?" is-owned":""}`}>
                <div className="coin-shop-item__icon">{item.icon}</div>
                <div className="coin-shop-item__info">
                  <div className="coin-shop-item__name">{item.label}</div>
                  {item.desc&&<div className="coin-shop-item__desc">{item.desc}</div>}
                </div>
                <button
                  className={`coin-shop-item__btn${isOwned?" is-owned":canBuy?"":""}`}
                  onClick={()=>buy(item)}
                  disabled={isOwned}
                >
                  {isOwned?"✓":`${item.cost}🪙`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
