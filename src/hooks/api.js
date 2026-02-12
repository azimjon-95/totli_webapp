import { getInitData } from "./tg";

const API = import.meta.env.VITE_API_URL; // masalan: https://yourdomain.com/api/webapp

export async function apiGet(path) {
    const r = await fetch(`${API}${path}`, {
        headers: { "x-telegram-init-data": getInitData() }
    });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || "API_ERROR");
    return j.data;
}
