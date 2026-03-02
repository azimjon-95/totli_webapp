import axios from "axios";

export const PROD_API = "https://cake.medme.uz";

export function isInTelegram() {
    return !!window.Telegram?.WebApp?.initData;
}

function isLocalLike() {
    const h = window.location.hostname;
    return h === "localhost" || h === "127.0.0.1";
}

// ✅ local/telegram => proxy ishlaydi => ""
export const API_BASE = isLocalLike() ? "" : PROD_API;

function getTelegramInitData() {
    return window.Telegram?.WebApp?.initData || "";
}

const api = axios.create({
    baseURL: API_BASE,
    timeout: 20000,
});

api.interceptors.request.use((config) => {
    const initData = getTelegramInitData();
    if (initData) config.headers["x-telegram-init-data"] = initData;
    else if (isLocalLike()) config.headers["x-telegram-test"] = "local-dev";
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        const msg =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            "API_ERROR";
        return Promise.reject(new Error(msg));
    }
);

function buildUrl(path) {
    return `/api/webapp${path}`;
}

export async function apiGet(path, params) {
    const res = await api.get(buildUrl(path), { params });
    if (res.data?.ok === false) throw new Error(res.data?.error || "API_ERROR");
    return res.data?.data ?? res.data;
}

export async function apiPost(path, body, params) {
    const res = await api.post(buildUrl(path), body ?? {}, { params });
    if (res.data?.ok === false) throw new Error(res.data?.error || "API_ERROR");
    return res.data?.data ?? res.data;
}

export async function apiPut(path, body, params) {
    const res = await api.put(buildUrl(path), body ?? {}, { params });
    if (res.data?.ok === false) throw new Error(res.data?.error || "API_ERROR");
    return res.data?.data ?? res.data;
}

export async function apiDel(path, params) {
    const res = await api.delete(buildUrl(path), { params });
    if (res.data?.ok === false) throw new Error(res.data?.error || "API_ERROR");
    return res.data?.data ?? res.data;
}

export default api;

// import axios from "axios";

// const PROD_API = "https://cake.medme.uz";

// const isLocalLike = () => {
//     const h = window.location.hostname;
//     return h === "localhost" || h === "127.0.0.1" || h.endsWith(".ngrok-free.app");
// };

// export function isInTelegram() {
//     return !!window.Telegram?.WebApp?.initData;
// }

// function getTelegramInitData() {
//     return window.Telegram?.WebApp?.initData || "";
// }

// // ✅ ngrok/local/telegram test => proxy ishlaydi => baseURL bo‘sh
// // ✅ prod => real domen
// const API = isLocalLike() || isInTelegram() ? "" : PROD_API;

// const api = axios.create({
//     baseURL: API,
//     timeout: 15000,
// });

// api.interceptors.request.use((config) => {
//     const initData = getTelegramInitData();
//     if (initData) config.headers["x-telegram-init-data"] = initData;
//     else if (isLocalLike()) config.headers["x-telegram-test"] = "local-dev";
//     return config;
// });

// function buildUrl(path) {
//     // path: "/customer/me" kabi bo‘lsin
//     return `/api/webapp${path}`;
// }

// function pickError(res) {
//     return res?.data?.error || res?.data?.message || "API_ERROR";
// }

// export async function apiGet(path, params) {
//     const res = await api.get(buildUrl(path), { params });
//     if (!res.data?.ok) throw new Error(pickError(res));
//     return res.data.data;
// }

// export async function apiPost(path, body, params) {
//     const res = await api.post(buildUrl(path), body ?? {}, { params });
//     if (!res.data?.ok) throw new Error(pickError(res));
//     return res.data.data;
// }

// export async function apiPut(path, body, params) {
//     const res = await api.put(buildUrl(path), body ?? {}, { params });
//     if (!res.data?.ok) throw new Error(pickError(res));
//     return res.data.data;
// }

// export async function apiDel(path, params) {
//     const res = await api.delete(buildUrl(path), { params });
//     if (!res.data?.ok) throw new Error(pickError(res));
//     return res.data.data;
// }

// export const API_BASE = window.location.origin;
// export const API_ORIGIN = window.location.origin;