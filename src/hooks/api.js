import axios from "axios";

export const PROD_API = "https://cake.medme.uz";
export const API_BASE = PROD_API;

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
export function isInTelegram() {
    return !!window.Telegram?.WebApp?.initData;
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




