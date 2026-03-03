import React, { useEffect } from "react";
import { FiHome, FiShare2 } from "react-icons/fi";
import { TbCoinMonero } from "react-icons/tb";
import { LiaBirthdayCakeSolid } from "react-icons/lia";

const items = [
    { key: "main", label: "Main", icon: FiHome },
    { key: "scanner", label: "Scanner", icon: LiaBirthdayCakeSolid },
    { key: "coin", label: "Coin", icon: TbCoinMonero },
    { key: "share", label: "Share", icon: FiShare2 },
];

function useSafeBottom() {
    useEffect(() => {
        const setSafe = () => {
            const vv = window.visualViewport;

            if (vv) {
                const safe = Math.max(
                    0,
                    window.innerHeight - vv.height - vv.offsetTop
                );
                document.documentElement.style.setProperty(
                    "--safe-bottom-js",
                    safe + "px"
                );
            }
        };

        setSafe();

        window.visualViewport?.addEventListener("resize", setSafe);
        window.visualViewport?.addEventListener("scroll", setSafe);
        window.addEventListener("resize", setSafe);

        return () => {
            window.visualViewport?.removeEventListener("resize", setSafe);
            window.visualViewport?.removeEventListener("scroll", setSafe);
            window.removeEventListener("resize", setSafe);
        };
    }, []);
}

export default function BottomNav({ value, onChange }) {
    useSafeBottom();

    return (
        <div className="cw-nav">
            {items.map((it) => {
                const Icon = it.icon;
                const active = value === it.key;

                return (
                    <button
                        key={it.key}
                        type="button"
                        className={`cw-nav__item ${active ? "is-active" : ""}`}
                        onClick={() => onChange(it.key)}
                    >
                        <Icon className="cw-nav__icon" size={22} />
                        {/* <span className="cw-nav__label">{it.label}</span> */}
                    </button>
                );
            })}
        </div>
    );
}