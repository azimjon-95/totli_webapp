import React,{useEffect,useMemo,useState} from "react";
import {apiGet} from "../hooks/api";
import BottomNav from "./ui/BottomNav";
import MainTab from "./tabs/MainTab";
import ShareTab from "./tabs/ShareTab";
import CoinTab from "./tabs/CoinTab";
import CatalogTab from "./tabs/CatalogTab";

export default function CustomerTabs(){
  const tgUser=window.Telegram?.WebApp?.initDataUnsafe?.user;
  const token=useMemo(()=>new URLSearchParams(window.location.search).get("token"),[]);
  const [tab,setTab]=useState("main");
  const [me,setMe]=useState(null);
  const [history,setHistory]=useState([]);
  const [ref,setRef]=useState(null);
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    window.Telegram?.WebApp?.ready?.();
    window.Telegram?.WebApp?.expand?.();
    (async()=>{
      try{
        setErr(""); setLoading(true);
        const params=token?{token}:undefined;
        const[meD,hisD,refD]=await Promise.all([
          apiGet("/customer/me",params),
          apiGet("/customer/history",params),
          apiGet("/customer/ref/stats",params),
        ]);
        setMe(meD?.customer||meD);
        setHistory(hisD?.list||[]);
        setRef(refD?.ref||null);
      }catch(e){setErr(e?.message||"Xatolik");}
      finally{setLoading(false);}
    })();
  },[token]);

  const content=
    tab==="share"  ?<ShareTab loading={loading} err={err} tgUser={tgUser} me={me} ref={ref} botUsername="totli_bonuslari_bot"/>:
    tab==="coin"   ?<CoinTab  loading={loading} me={me}/>:
    tab==="catalog"?<CatalogTab tgUser={tgUser}/>:
                    <MainTab loading={loading} err={err} tgUser={tgUser} me={me} history={history}/>;

  return(
    <div className="cw-shell">
      <div className="cw-shell__content">{content}</div>
      <BottomNav value={tab} onChange={setTab}/>
    </div>
  );
}
