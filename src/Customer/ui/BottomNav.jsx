import React from "react";
import { FiHome, FiShare2 } from "react-icons/fi";
import { TbCoinMonero } from "react-icons/tb";
import { LiaBirthdayCakeSolid } from "react-icons/lia";

const items = [
    { key: "main", label: "Main", icon: FiHome },
    { key: "scanner", label: "Scanner", icon: LiaBirthdayCakeSolid },
    { key: "coin", label: "Coin", icon: TbCoinMonero },
    { key: "share", label: "Share", icon: FiShare2 },
];

export default function BottomNav({ value, onChange }) {
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
                    </button>
                );
            })}
        </div>
    );
}