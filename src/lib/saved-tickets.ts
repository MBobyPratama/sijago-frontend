export interface SavedTicket { ticketCode: string; savedAt: string }
const KEY = "sijago-saved-tickets-v1";
export const TICKET_EVENT = "sijago:saved-tickets";
export function readSavedTickets(): SavedTicket[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    return value.filter((item): item is SavedTicket => Boolean(item && typeof item.ticketCode === "string" && /^[A-Z0-9-]{3,64}$/.test(item.ticketCode) && typeof item.savedAt === "string" && Number.isFinite(Date.parse(item.savedAt)))).filter(item => { if (seen.has(item.ticketCode)) return false; seen.add(item.ticketCode); return true; }).slice(0, 50);
  } catch { return []; }
}
export function saveTicket(ticketCode: string): boolean {
  if (!/^[A-Z0-9-]{3,64}$/.test(ticketCode)) return false;
  try {
    const previous = readSavedTickets();
    const existing = previous.find(item => item.ticketCode === ticketCode);
    localStorage.setItem(KEY, JSON.stringify([{ ticketCode, savedAt: existing?.savedAt || new Date().toISOString() }, ...previous.filter(item => item.ticketCode !== ticketCode)].slice(0, 50)));
    window.dispatchEvent(new Event(TICKET_EVENT));
    return true;
  } catch { return false; }
}
export function clearSavedTickets(): boolean {
  try { localStorage.removeItem(KEY); window.dispatchEvent(new Event(TICKET_EVENT)); return true; } catch { return false; }
}
export function trackingPath(ticketCode: string) { return `/lacak?kode=${encodeURIComponent(ticketCode)}`; }
export async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(value); return; } catch { /* Try the browser's fallback copy action. */ }
  }
  const previous = document.activeElement as HTMLElement | null;
  const input = document.createElement("textarea");
  input.value = value; input.readOnly = true;
  input.style.position = "fixed"; input.style.opacity = "0";
  document.body.appendChild(input);
  try { input.select(); if (!document.execCommand("copy")) throw new Error("COPY_FAILED"); }
  finally { input.remove(); previous?.focus(); }
}
