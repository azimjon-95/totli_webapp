// ShareTab.jsx - do'stlarni taklif qilish va bonus ballarni ko'rish
import React, { useState } from "react";
import '../styles/share.css';

function buildReferralLink(botUsername, tgId) {
    return `https://t.me/${botUsername}?start=ref_${tgId}`;
}

function openShare(link) {
    const text =
        "🎁 Totli bonus dasturi!\n" +
        "✅ Har 3 ta do'st sizning linkingiz orqali botni ochsa — 1 ball beriladi.\n" +
        "📩 Hozir do'stlaringizga yuboring:";
    window.Telegram?.WebApp?.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`
    );
}

function SkeletonShare() {
    return (
        <div className="share-wrap">
            <div className="share-hero">
                <div className="sk" style={{ width: "40%", height: 11, marginBottom: 10 }} />
                <div className="sk" style={{ width: "70%", height: 26, marginBottom: 14 }} />
                <div className="sk" style={{ width: "90%", height: 13, marginBottom: 6 }} />
                <div className="sk" style={{ width: "75%", height: 13 }} />
            </div>
            <div className="share-stats">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="share-stat">
                        <div className="sk" style={{ width: "55%", height: 28, margin: "0 auto 8px" }} />
                        <div className="sk" style={{ width: "70%", height: 10, margin: "0 auto" }} />
                    </div>
                ))}
            </div>
            <div className="share-actions" style={{ borderRadius: "0 0 24px 24px" }}>
                <div className="sk" style={{ height: 46 }} />
                <div className="sk" style={{ height: 46 }} />
            </div>
        </div>
    );
}

export default function ShareTab({ loading, err, tgUser, me, ref: refData, botUsername }) {
    const [toastMsg, setToastMsg] = useState("");
    const [toastVisible, setToastVisible] = useState(false);

    const myTgId = me?.tgId || tgUser?.id;
    const myInviteLink = botUsername && myTgId ? buildReferralLink(botUsername, myTgId) : null;

    const count = refData?.count ?? 0;
    const pointsFromInvites = refData?.pointsFromInvites ?? 0;
    const leftToNext = refData?.leftToNext ?? 3;

    // Progress: friends toward next point (0–3)
    const progress = ((3 - leftToNext) / 3) * 100;

    function showToast(msg) {
        setToastMsg(msg);
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 2200);
    }

    async function copyLink() {
        if (!myInviteLink) return;
        try {
            await navigator.clipboard.writeText(myInviteLink);
            showToast("✅ Link nusxalandi!");
            window.Telegram?.WebApp?.showToast?.("✅ Link nusxalandi");
        } catch {
            alert(myInviteLink);
        }
    }

    if (loading) {
        return (
            <div className="share-root">
                <SkeletonShare />
            </div>
        );
    }

    return (
        <div className="share-root">

            <div className="share-wrap">
                {err && (
                    <div style={{ background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.2)", borderRadius: 12, padding: "10px 16px", fontSize: 13, color: "#ff8080", marginBottom: 10 }}>
                        ⚠️ {err}
                    </div>
                )}

                {/* HERO */}
                <div className="share-hero">
                    <div className="share-hero__label">📩 Bonus dasturi</div>
                    <div className="share-hero__title">
                        Do'stlarni <span>taklif qil</span>,<br />ball yig'!
                    </div>
                    <div className="share-hero__rule">
                        Har <span className="tag">3 ta</span> do'st linkingiz orqali kirsa —{" "}
                        <b>1 ball</b> qo'shiladi.<br />
                        Bir odam faqat <b>bir marta</b> hisoblanadi.
                    </div>
                </div>

                {/* STATS */}
                <div className="share-stats">
                    <div className="share-stat">
                        <div className="share-stat__val">{count}</div>
                        <div className="share-stat__lbl">Takliflar</div>
                    </div>
                    <div className="share-stat">
                        <div className="share-stat__val">{pointsFromInvites}</div>
                        <div className="share-stat__lbl">Invite ball</div>
                    </div>
                    <div className="share-stat">
                        <div className="share-stat__val">{leftToNext}</div>
                        <div className="share-stat__lbl">Keyingi ball</div>
                    </div>
                </div>

                {/* PROGRESS */}
                <div className="share-progress-wrap">
                    <div className="share-progress-top">
                        <span>Keyingi ballga progress</span>
                        <span>{3 - leftToNext} / 3 do'st</span>
                    </div>
                    <div className="share-progress-bar">
                        <div className="share-progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                {/* LINK */}
                {myInviteLink && (
                    <div className="share-link-box">
                        <div className="share-link-dot" />
                        <div className="share-link-text">{myInviteLink}</div>
                    </div>
                )}

                {/* ACTIONS */}
                <div className="share-actions">
                    <button
                        className="share-btn share-btn--primary"
                        disabled={!myInviteLink}
                        onClick={() => myInviteLink && openShare(myInviteLink)}
                    >
                        📲 Ulashish
                    </button>
                    <button
                        className="share-btn share-btn--secondary"
                        disabled={!myInviteLink}
                        onClick={copyLink}
                    >
                        🔗 Nusxalash
                    </button>
                </div>
            </div>

            {/* TOAST */}
            <div className={`share-toast ${toastVisible ? "show" : ""}`}>{toastMsg}</div>
        </div>
    );
}