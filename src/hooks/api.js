import { getInitData } from "./tg";

const API = import.meta.env.VITE_API_URL; // masalan: https://your-backend.com

export function isInTelegram() {
    return !!window.Telegram?.WebApp?.initData;
}

export async function apiGet(path) {
    const initData = getInitData();

    const res = await fetch(`${API}/api/webapp${path}`, {
        method: "GET",
        headers: {
            "x-telegram-init-data": initData,
        },
    });

    const json = await res.json();
    if (!json?.ok) throw new Error(json?.error || "API_ERROR");
    return json.data; // ✅ doim data qaytadi
}
