import axios from "axios";

// Ensure backend URL exists
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
if (!BACKEND_URL) {
  console.warn("⚠️ VITE_BACKEND_URL is missing in your .env file");
}

export const API = `${BACKEND_URL}/api`;

// Axios instance
export const http = axios.create({
  baseURL: API,
  withCredentials: true,
});

// Format currency
export const formatNaira = (amount) => {
  const n = Number(amount || 0);
  return `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
};

// Format API errors consistently
export const formatApiError = (detail) => {
  if (detail == null) return "Something went wrong. Please try again.";

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((e) =>
        e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)
      )
      .join(" ");
  }

  if (detail && typeof detail.msg === "string") return detail.msg;

  return String(detail);
};
