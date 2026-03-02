// CustomerTabs.jsx
import React, { useEffect, useMemo, useState } from "react";
import { apiGet } from "../hooks/api";

import BottomNav from "./ui/BottomNav";
import MainTab from "./tabs/MainTab";
import ShareTab from "./tabs/ShareTab";
import ScannerTab from "./tabs/ScannerTab";
import CoinTab from "./tabs/CoinTab";

export default function CustomerTabs() {
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const token = useMemo(() => new URLSearchParams(window.location.search).get("token"), []);

    const [tab, setTab] = useState("main"); // default
    const [me, setMe] = useState(null);
    const [history, setHistory] = useState([]);
    const [ref, setRef] = useState(null);

    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(true);

    const botUsername = "totli_bonuslari_bot";

    useEffect(() => {
        (async () => {
            try {
                setErr("");
                setLoading(true);

                const params = token ? { token } : undefined;

                const meData = await apiGet("/customer/me", params);
                const hisData = await apiGet("/customer/history", params);
                const refData = await apiGet("/customer/ref/stats", params);

                setMe(meData?.customer || meData);
                setHistory(hisData?.list || []);
                setRef(refData?.ref || null);
            } catch (e) {
                setErr(e?.message || "Xatolik");
            } finally {
                setLoading(false);
            }
        })();
    }, [token]);

    const content =
        tab === "share" ? (
            <ShareTab loading={loading} err={err} tgUser={tgUser} me={me} ref={ref} botUsername={botUsername} />
        ) : tab === "scanner" ? (
            <ScannerTab loading={loading} me={me} />
        ) : tab === "coin" ? (
            <CoinTab loading={loading} me={me} />
        ) : (
            <MainTab loading={loading} err={err} tgUser={tgUser} me={me} history={history} />
        );

    return (
        <div className="cw-shell">
            <div className="cw-shell__content">
                <div className="cw-header">
                    <h2 className="cw-header__title">🎁 Totli Bonuslari</h2>
                </div>

                {content}
            </div>

            <BottomNav value={tab} onChange={setTab} />
        </div>
    );
}