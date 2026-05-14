import React from "react";

function fmt(n) { return Number(n || 0).toLocaleString("uz-UZ"); }

const REWARDS = [
  { at: 0, label: "Start", sub: "Boshlash", icon: "🌱" },
  { at: 20000, label: "Pirojniy", sub: "20 000 so'm", icon: "🧁" },
  { at: 70000, label: "Bento", sub: "70 000 so'm", icon: "🍱" },
  { at: 140000, label: "Tort", sub: "140 000 so'm", icon: "🎂" },
];

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function getNext(pts) { return REWARDS.find(r => r.at > pts) || null; }
function getPct(pts) { const last = REWARDS[REWARDS.length - 1].at; return (clamp(pts, 0, last) / last) * 100; }

function Sk({ w, h, r, style }) { return <div className="sk" style={{ width: w || "100%", height: h || 14, borderRadius: r || 8, ...style }} />; }

function SkProfile() {
  return (
    <div className="cw-profile sk-profile-wrap" style={{ animation: "none" }}>
      <Sk w={60} h={60} r="50%" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <Sk w="65%" h={15} r={8} />
        <Sk w="40%" h={10} r={6} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
        <Sk w={40} h={10} r={6} />
        <Sk w={60} h={28} r={8} />
      </div>
    </div>
  );
}

export default function MainTab({ loading, err, tgUser, me, history }) {
  const name = me?.tgName || tgUser?.first_name || "Mijoz";
  const tgId = me?.tgId || tgUser?.id;
  const pts = Number(me?.points || 0);
  const next = getNext(pts);
  const pct = getPct(pts);
  const avatarUrl = tgUser?.photo_url;

  return (
    <div className="cw-tab">
      {err && <div className="cw-error">⚠ {err}</div>}

      {/* PROFILE */}
      {loading ? <SkProfile /> : (
        <div className="cw-profile fadeUp">
          <div className="cw-profile__avatar-wrap">
            {avatarUrl
              ? <img className="cw-profile__avatar" src={avatarUrl} alt={name} />
              : <div className="cw-profile__avatar" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, background: "var(--surface2)", borderColor: "var(--border)" }}>
                {name[0]?.toUpperCase()}
              </div>
            }
            <div className="cw-profile__avatar-ring" />
          </div>
          <div className="cw-profile__info">
            <div className="cw-profile__name">{name}</div>
            <div className="cw-profile__id">ID: <span>{tgId || "—"}</span></div>
          </div>
          <div className="cw-points">
            <div className="cw-points__value">{fmt(Math.floor(pts))}</div>
            <div className="cw-points__label">so'm</div>
          </div>
        </div>
      )}

      {/* REWARD */}
      {!loading && (
        <div className="cw-reward">
          <div className="cw-reward__head">
            <div className="cw-reward__title">🎯 Bonus bosqichlari</div>
            <div className="cw-reward__next">
              {next ? (
                <>
                  Keyingi: <b>{next.label} {next.icon}</b> —{" "}
                  <b>{fmt(Math.floor(next.at - pts))}</b> so'm qoldi
                </>
              ) : (
                <>✅ Barcha bosqichlar ochildi!</>
              )}
            </div>
          </div>
          <div className="cw-reward__bar">
            <div className="cw-reward__barFill" style={{ width: `${pct}%` }} />
          </div>
          <div className="cw-reward__steps">
            {REWARDS.map((r, i) => {
              const done = pts >= r.at;
              return (
                <div key={r.at} className={`cw-reward__step${done ? " is-done" : ""}`}>
                  <div className="cw-reward__dot">{done ? "✓" : r.icon}</div>
                  <div className="cw-reward__label">{r.label}</div>
                  <div className="cw-reward__sub">{r.sub}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* HISTORY */}
      <div className="cw-section-heading">🧾 Cheklar tarixi</div>
      <div className="cw-history">
        {loading && [0, 1, 2, 3].map(i => (
          <div key={i} className="cw-receipt">
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <div className="sk" style={{ width: "50%", height: 13, borderRadius: 7 }} />
              <div className="sk" style={{ width: "75%", height: 10, borderRadius: 6 }} />
            </div>
            <div className="sk" style={{ gridRow: "1/3", gridColumn: 2, alignSelf: "center", width: 56, height: 40, borderRadius: 8 }} />
          </div>
        ))}
        {!loading && (!history || history.length === 0) && (
          <div className="cw-history__empty">Hozircha cheklar tarixi yo'q 🧾</div>
        )}
        {!loading && (history || []).map((x, i) => (
          <div key={x._id || i} className="cw-receipt fadeUp" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="cw-receipt__order">Chek <span>#{x.orderNo || "—"}</span></div>
            {Number(x.salePaid) > 0 && (
              <div className="cw-receipt__badge">+{fmt(Math.floor(Number(x.salePaid) * 0.1))} so'm</div>
            )}
            <div className="cw-receipt__meta">
              <span className="cw-receipt__amount"><strong>{fmt(x.salePaid)}</strong> so'm</span>
              <span className="cw-receipt__date">{x.redeemedAt ? new Date(x.redeemedAt).toLocaleString() : "—"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
