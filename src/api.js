export function getInitData() {
    const tg = window.Telegram?.WebApp;
    return tg?.initData || "";
}

export async function apiGet(url) {
    const initData = getInitData();
    const res = await fetch(url, {
        headers: {
            "x-telegram-init-data": initData
        }
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || "Xatolik");
    return json;
}

export function isInTelegram() {
    return !!window.Telegram?.WebApp?.initData;
}
