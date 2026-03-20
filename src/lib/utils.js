import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

export function fmtShortDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00");
  return `${d.getMonth() + 1}.${d.getDate()}`;
}

export function fmtTimeTo12h(t) {
  if (!t) return "";
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const m = mStr || "00";
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${period}`;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function buildExcelRow(p) {
  const doctor = p.doctor || "";
  const time = fmtTimeTo12h(p.consultation_time || p.consultationTime);
  const dateStr = fmtShortDate(p.consultation_date || p.consultationDate);
  const phone = p.phone || "";
  const phoneCell = [phone, dateStr].filter(Boolean).join(" ");
  const notes = p.notes || "";
  return [doctor, time, phoneCell, notes].join("\t");
}

export async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
  } else {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0;";
    document.body.appendChild(el);
    el.focus();
    el.select();
    try { document.execCommand("copy"); } catch {}
    document.body.removeChild(el);
  }
}
