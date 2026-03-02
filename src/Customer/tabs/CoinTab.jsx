// CoinTab.jsx - tort bosish o'yini
import React, { useEffect, useMemo, useRef, useState } from "react";
import cakequote from "../img/cake.png";
import mini from "../img/mini.png";
import "../styles/coinTab.css";

function fmt(n) {
    return Number(n || 0).toLocaleString("uz-UZ");
}

const LS_KEY = "cw_taps";

// ✅ coin bosqichlari: 1000, 3000, 5000, 7000, ... (cheksiz)
// coin 1 uchun 1000
// coin 2 uchun +3000 (jami 4000)
// coin 3 uchun +5000 (jami 9000)
// coin 4 uchun +7000 (jami 16000)
function coinStateFromTaps(taps) {
    let coin = 0;
    let need = 1000;     // keyingi coin uchun kerak bo'ladigan tap
    const stepAdd = 2000; // har bosqichda +2000 qo'shiladi
    let remaining = Math.floor(Number(taps) || 0);

    while (remaining >= need) {
        remaining -= need;
        coin++;
        need += stepAdd; // 1000 -> 3000 -> 5000 -> 7000 -> ...
    }

    // progress = hozirgi bosqich ichida yig'ilgan taplar
    // need = keyingi coin uchun kerak bo'ladigan taplar
    return { coin, progress: remaining, need };
}

export default function CoinTab() {
    // ✅ faqat localStorage dan oladi
    const initialTaps = useMemo(() => {
        return Number(localStorage.getItem(LS_KEY) || 0);
    }, []);

    useEffect(() => {
        const img = new Image();
        img.src = cakequote;
    }, []);

    const btnRef = useRef(null);

    const [taps, setTaps] = useState(initialTaps);
    const [pop, setPop] = useState(false);

    // uchib chiqadigan tortchalar
    const [flies, setFlies] = useState([]);
    const flyId = useRef(1);

    // ✅ taps o‘zgarsa — localStorage ga saqlaydi
    useEffect(() => {
        localStorage.setItem(LS_KEY, String(Math.floor(taps)));
    }, [taps]);

    // ✅ coin/progress/need ni threshold bo‘yicha hisoblaymiz
    const coinInfo = useMemo(() => coinStateFromTaps(taps), [taps]);
    const coins = coinInfo.coin;
    const progress = coinInfo.progress;
    const need = coinInfo.need;

    const progressPct = useMemo(() => {
        return need > 0 ? (progress / need) * 100 : 0;
    }, [progress, need]);

    function spawnFly(cx, cy) {
        const id = flyId.current++;

        const dx = (Math.random() - 0.5) * 160;
        const dy = -120 - Math.random() * 140;
        const rot = (Math.random() - 0.5) * 40;
        const scale = 0.85 + Math.random() * 0.35;

        const one = { id, x: cx, y: cy, dx, dy, rot, scale };
        setFlies((p) => [...p, one]);

        setTimeout(() => {
            setFlies((p) => p.filter((f) => f.id !== id));
        }, 900);
    }

    function haptic(type = "light") {
        const tg = window.Telegram?.WebApp;

        if (tg?.HapticFeedback) {
            if (type === "light" || type === "medium" || type === "heavy") {
                tg.HapticFeedback.impactOccurred(type);
                return;
            }
            tg.HapticFeedback.notificationOccurred(type);
            return;
        }

        if (navigator.vibrate) navigator.vibrate(15);
    }

    // ✅ click kuchi: inc = coin + 1
    function getIncByTaps(prevTaps) {
        const c = coinStateFromTaps(prevTaps).coin;
        return c + 1; // coin=0 => +1, coin=1 => +2, ...
    }

    function handleClick() {
        const btn = btnRef.current;
        if (!btn) return;

        const rect = btn.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;

        // ✅ hozirgi taps bo‘yicha inc (coin=1 bo‘lsa +2)
        const inc = getIncByTaps(taps);

        // ✅ taps oshadi
        setTaps((prev) => prev + inc);

        // ✅ animatsiya ham inc ta bo‘lib uchadi
        for (let i = 0; i < inc; i++) spawnFly(cx, cy);

        setPop(true);
        setTimeout(() => setPop(false), 120);
        haptic("light");
    }

    function handleTouchStart(e) {
        e.preventDefault();

        const touchesCount = e.touches?.length || 1;
        haptic(touchesCount >= 3 ? "heavy" : touchesCount === 2 ? "medium" : "light");

        const btn = btnRef.current;
        if (!btn) return;

        const rect = btn.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;

        const inc = getIncByTaps(taps);
        const add = inc * touchesCount;

        setTaps((prev) => prev + add);

        setPop(true);
        setTimeout(() => setPop(false), 120);

        // ✅ multi-touch bo‘lsa ham add nechta bo‘lsa shuncha uchadi
        // (og‘irlashmasin desang, max limit qo‘yib yuboramiz)
        for (let i = 0; i < add; i++) spawnFly(cx, cy);
    }


    return (
        <div className="cw-coin">
            {/* PROGRESS */}
            <div className="cw-progress">
                <div className="cw-progress__row">
                    <div className="cw-progress__label">Coin</div>
                    <div className="cw-progress__value">{fmt(coins)}</div>
                </div>

                <div className="cw-progress__row">
                    <div className="cw-progress__label">Keyingi coin uchun</div>
                    <div className="cw-progress__value">{fmt(need)} ta bosish</div>
                </div>

                <div className="cw-progress__hint">
                    Keyingi coin: {fmt(need - progress)} ta bosish qoldi
                </div>
            </div>

            {/* BALANCE */}
            <div className="cw-coin__balance">
                <div className="cw-coin__balanceIcon">🪙</div>
                <div className="cw-coin__balanceNum">{fmt(Math.floor(taps))}</div>
            </div>

            {/* CLICK AREA */}
            <div className="cw-clickArea">
                <button
                    type="button"
                    ref={btnRef}
                    className={`cw-cakeBtn ${pop ? "is-pop" : ""}`}
                    onTouchStart={handleTouchStart}
                    onClick={handleClick}
                    aria-label="Tortni bosing"
                >
                    {/* ✅ PROGRESS RING */}
                    <div className="cw-ring" aria-hidden="true">
                        <svg className="cw-ringSvg" viewBox="0 0 120 120">
                            {/* fon ring */}
                            <circle className="cw-ringBg" cx="60" cy="60" r="54" />
                            {/* to‘ladigan ring */}
                            <circle
                                className="cw-ringFg"
                                cx="60"
                                cy="60"
                                r="54"
                                style={{ "--p": progressPct }}
                            />
                        </svg>
                    </div>

                    {/* tort */}
                    <img
                        src={cakequote}
                        alt="Totli tort"
                        className="cw-cakeImg"
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                    />

                    {/* fly layer */}
                    <div className="cw-flyLayer">
                        {flies.map((f) => (
                            <div
                                key={f.id}
                                className="cw-fly"
                                style={{
                                    left: f.x,
                                    top: f.y,
                                    "--dx": `${f.dx}px`,
                                    "--dy": `${f.dy}px`,
                                    "--rot": `${f.rot}deg`,
                                    "--sc": f.scale,
                                }}
                            >
                                <img src={mini} alt="" draggable={false} />
                            </div>
                        ))}
                    </div>
                </button>
            </div>

            {/* FOOT */}
            <div className="cw-boost">
                <div className="cw-boost__left">
                    ⚡ {fmt(progress)} / {fmt(need)}
                </div>

                <div className="cw-boost__right">
                    <button className="cw-boost__btn" type="button">
                        🚀 Boost
                    </button>

                    {/* xohlasang ochib qo'yasan */}
                    {/* <button
            className="cw-boost__btn cw-boost__btn--danger"
            type="button"
            onClick={resetAll}
          >
            ♻️ Reset
          </button> */}
                </div>
            </div>
        </div>
    );
}