export function getInitData() {
    return window.Telegram?.WebApp?.initData || "";
}

export function ensureTelegramOnly() {
    const ok = !!window.Telegram?.WebApp?.initData;
    if (!ok) {
        document.body.innerHTML = `
      <div style="padding:18px;font-family:system-ui;">
        <h3>❌ Bu sahifa faqat Telegram ichida ishlaydi</h3>
        <p>Botdan <b>Открыть</b> tugmasini bosing.</p>
      </div>
    `;
        throw new Error("NOT_TELEGRAM");
    }
}
