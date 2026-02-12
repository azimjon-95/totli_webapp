export function getInitData() {
    return window.Telegram?.WebApp?.initData || "";
}

export function ensureTelegramOnly() {
    if (!window.Telegram?.WebApp?.initData) {
        document.body.innerHTML = `<div style="padding:16px;font-family:sans-serif">
      ❌ Bu sahifa faqat Telegram ichida ishlaydi. Botdan <b>Открыть</b> ni bosing.
    </div>`;
        throw new Error("NOT_TELEGRAM");
    }
}
