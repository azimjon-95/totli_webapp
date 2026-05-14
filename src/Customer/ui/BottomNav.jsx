import React,{useEffect} from "react";

const TABS=[
  {key:"main",    label:"Asosiy",  icon:"🏠"},
  {key:"catalog", label:"Katalog", icon:"🎂"},
  {key:"coin",    label:"Coin",    icon:"🪙"},
  {key:"share",   label:"Ulash",   icon:"📲"},
];

function useSafeBottom(){
  useEffect(()=>{
    const set=()=>{
      const vv=window.visualViewport;
      if(vv){
        const safe=Math.max(0,window.innerHeight-vv.height-vv.offsetTop);
        document.documentElement.style.setProperty("--safe-bottom-js",safe+"px");
      }
    };
    set();
    window.visualViewport?.addEventListener("resize",set);
    window.visualViewport?.addEventListener("scroll",set);
    window.addEventListener("resize",set);
    return()=>{
      window.visualViewport?.removeEventListener("resize",set);
      window.visualViewport?.removeEventListener("scroll",set);
      window.removeEventListener("resize",set);
    };
  },[]);
}

export default function BottomNav({value,onChange}){
  useSafeBottom();
  return(
    <div className="cw-nav">
      {TABS.map(t=>(
        <button key={t.key} type="button"
          className={`cw-nav__item${value===t.key?" is-active":""}`}
          onClick={()=>onChange(t.key)}
        >
          <span className="cw-nav__icon">{t.icon}</span>
          <span className="cw-nav__label">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
