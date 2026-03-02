import React from "react";

function fmt(n) {
    return Number(n || 0).toLocaleString("uz-UZ");
}
const REWARDS = [
    { at: 0, label: "Start", subtitle: "Boshlash" },
    { at: 20000, label: "Pirojniy", subtitle: "20 000 so'm" },
    { at: 70000, label: "Bento", subtitle: "70 000 so'm" },
    { at: 140000, label: "Tort", subtitle: "140 000 so'm" },
];
function Sk({ w, h, r, style }) {
    return <div className="sk" style={{ width: w || "100%", height: h || 14, borderRadius: r || 6, ...style }} />;
}
function getNextReward(points) {
    const p = Number(points || 0);
    return REWARDS.find((r) => r.at > p) || null;
}
function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
}

// ✅ progress 0..lastReward (so‘m) bo‘yicha
function getProgressPercent(points) {
    const p = Number(points || 0);
    const last = REWARDS[REWARDS.length - 1].at; // 140000
    const safe = clamp(p, 0, last);
    return (safe / last) * 100;
}

function SkProfile() {
    return (
        <div className="cw-profile sk-profile-wrap">
            <div className="cw-profile__avatar-wrap"><Sk w={64} h={64} r="50%" /></div>
            <div className="cw-profile__info" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Sk w="70%" h={16} r={8} />
                <Sk w="45%" h={11} r={6} />
            </div>
            <div className="cw-points" style={{ gap: 6, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Sk w={40} h={10} r={5} />
                <Sk w={52} h={32} r={8} />
            </div>
        </div>
    );
}
function SkReward() {
    return (
        <div className="cw-reward">
            <Sk w="45%" h={14} r={7} />
            <div style={{ marginTop: 10 }}>
                <Sk h={10} r={8} />
            </div>
            <div className="cw-reward__steps" style={{ marginTop: 12 }}>
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="cw-reward__step">
                        <Sk w={26} h={26} r="50%" />
                        <Sk w="70%" h={10} r={6} style={{ marginTop: 8 }} />
                    </div>
                ))}
            </div>
        </div>
    );
}
function SkReceipt({ delay }) {
    return (
        <div className="cw-receipt" style={{ animationDelay: `${delay}s` }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Sk w="55%" h={14} r={7} />
                <Sk w="80%" h={11} r={6} />
            </div>
            <div style={{ gridRow: "1/3", gridColumn: 2, alignSelf: "center" }}>
                <Sk w={52} h={38} r={8} />
            </div>
        </div>
    );
}

export default function MainTab({ loading, err, tgUser, me, history }) {
    const myTgId = me?.tgId || tgUser?.id;
    const myName = me?.tgName || tgUser?.first_name || "Mijoz";
    const pointsNum = Number(me?.points || 0);
    const next = getNextReward(pointsNum);
    const progressPct = getProgressPercent(pointsNum);

    return (
        <div className="cw-tab">
            {err && <div className="cw-error">⚠️ {err}</div>}

            {loading ? (
                <SkProfile />
            ) : (
                <div className="cw-profile" style={{ animation: "fadeIn 0.4s ease both" }}>
                    <div className="cw-profile__avatar-wrap">
                        <img className="cw-profile__avatar" src={tgUser?.photo_url || "https://via.placeholder.com/64"} alt="avatar" />
                        <div className="cw-profile__avatar-ring" />
                    </div>

                    <div className="cw-profile__info">
                        <div className="cw-profile__name">{myName}</div>
                        <div className="cw-profile__id">
                            ID: <span>{myTgId || "—"}</span>
                        </div>
                    </div>

                    <div className="cw-points">
                        <div className="cw-points__value">{fmt(Math.floor(pointsNum))}</div>
                        <div className="cw-points__label">So'm</div>
                    </div>
                </div>
            )}

            {/* ── REWARD PROGRESS ── */}
            {loading ? (
                <SkReward />
            ) : (
                <div className="cw-reward" style={{ animation: "fadeIn 0.45s 0.03s ease both" }}>
                    <div className="cw-reward__head">
                        <div className="cw-reward__title">🎯 Bonus bosqichlari</div>
                        <div className="cw-reward__next">
                            {next ? (
                                <>
                                    Keyingi: <b>{next.label}</b> — <b>{fmt(Math.floor(next.at - pointsNum))}</b> so'm qoldi
                                </>
                            ) : (
                                <>
                                    ✅ Sizda <b>{pointsNum}</b> barcha bosqichlar ochildi
                                </>
                            )}
                        </div>
                    </div>

                    <div className="cw-reward__bar">
                        <div className="cw-reward__barFill" style={{ width: `${progressPct}%` }} />
                    </div>

                    <div className="cw-reward__steps">
                        {REWARDS.map((r, idx) => {
                            const done = pointsNum >= r.at;
                            return (
                                <div key={r.at} className={`cw-reward__step ${done ? "is-done" : ""}`}>
                                    <div className="cw-reward__dot">{done ? "✓" : idx + 1}</div>
                                    <div className="cw-reward__label">{r.label}</div>
                                    <div className="cw-reward__sub">{r.subtitle}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="cw-section-heading">🧾 Cheklar tarixi</div>

            {loading ? (
                <div className="cw-history">
                    {[0, 1, 2, 3].map((i) => <SkReceipt key={i} delay={i * 0.06} />)}
                </div>
            ) : (
                <div className="cw-history">
                    {(!history || history.length === 0) && <div className="cw-history__empty">Hozircha cheklar tarixi yo‘q.</div>}

                    {(history || []).map((x, i) => (
                        <div key={x._id} className="cw-receipt" style={{ animationDelay: `${i * 0.06}s` }}>
                            <div className="cw-receipt__order">
                                Chek <span>#{x.orderNo || "—"}</span>
                            </div>

                            {Number(x.salePaid) / 10 > 0 && (
                                <div className="cw-receipt__badge">
                                    +{fmt(Math.floor(Number(x.salePaid) / 10))} so'm
                                </div>
                            )}

                            <div className="cw-receipt__meta">
                                <span className="cw-receipt__amount">
                                    <strong>{fmt(x.salePaid)}</strong> so'm
                                </span>
                                <span className="cw-receipt__date">
                                    {x.redeemedAt ? new Date(x.redeemedAt).toLocaleString() : "—"}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}