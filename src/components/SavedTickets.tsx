"use client";
import { useEffect, useRef, useState } from "react";
import { BookmarkCheck, Trash2, ChevronRight } from "lucide-react";
import { clearSavedTickets, readSavedTickets, TICKET_EVENT, type SavedTicket } from "@/lib/saved-tickets";
import "./ticket-tools.css";

export function SavedTickets({ onSelect }: { onSelect: (ticketCode: string) => void }) {
  const [tickets, setTickets] = useState<SavedTicket[]>([]);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const refresh = () => { const saved = readSavedTickets(); setTickets(saved); if (!saved.length) setConfirmOpen(false); }; refresh();
    window.addEventListener(TICKET_EVENT, refresh); window.addEventListener("storage", refresh);
    return () => { window.removeEventListener(TICKET_EVENT, refresh); window.removeEventListener("storage", refresh); };
  }, []);
  if (!tickets.length) return null;
  return <section className="saved-tickets" aria-labelledby="saved-tickets-heading">
    <div className="saved-tickets-heading"><h2 id="saved-tickets-heading"><BookmarkCheck size={20} aria-hidden="true" />Laporan dari perangkat ini</h2><button ref={deleteTrigger} type="button" className="ticket-tool" aria-haspopup="dialog" onClick={() => { setError(""); setConfirmOpen(true); }}><Trash2 size={16} aria-hidden="true" />Hapus riwayat</button></div>
    <p className="ticket-device-note">Tiket tersedia di browser ini. Riwayat dapat hilang jika data browser dibersihkan dan dapat dilihat oleh pengguna lain perangkat ini.</p>
    <ul className="saved-tickets-list">{tickets.map(ticket => <li key={ticket.ticketCode}><button type="button" className="saved-ticket-row" onClick={() => { onSelect(ticket.ticketCode); document.getElementById("tracking-code")?.focus(); }}><span><strong>{ticket.ticketCode}</strong><time dateTime={ticket.savedAt}>Disimpan {new Date(ticket.savedAt).toLocaleDateString("id-ID", { dateStyle: "medium" })}</time></span><ChevronRight size={19} aria-hidden="true" /></button></li>)}</ul>
    {error && !confirmOpen && <p role="alert" className="ticket-feedback">{error}</p>}
    {confirmOpen && <DeleteHistoryDialog error={error} onDismiss={() => { setConfirmOpen(false); requestAnimationFrame(() => (deleteTrigger.current || document.getElementById("tracking-code"))?.focus()); }} onConfirm={() => {
      if (clearSavedTickets()) { setError(""); requestAnimationFrame(() => document.getElementById("tracking-code")?.focus()); return true; }
      setError("Riwayat belum dapat dihapus. Periksa pengaturan penyimpanan browser."); return false;
    }} />}
  </section>;
}

function DeleteHistoryDialog({ error, onDismiss, onConfirm }: { error: string; onDismiss: () => void; onConfirm: () => boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.showModal();
    return () => { document.body.style.overflow = previous; };
  }, []);
  return <dialog ref={dialog} className="ticket-delete-dialog" aria-labelledby="ticket-delete-heading" aria-describedby="ticket-delete-description" onClose={onDismiss} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
    <div className="ticket-delete-content">
      <div className="ticket-delete-icon"><Trash2 size={24} aria-hidden="true" /></div>
      <h2 id="ticket-delete-heading">Hapus riwayat di perangkat ini?</h2>
      <p id="ticket-delete-description">Semua tiket yang tersimpan di browser ini akan dihapus dari daftar. Laporan di server tetap tersimpan dan masih bisa dilacak menggunakan kode tiket.</p>
      <p className="ticket-delete-reminder">Pastikan Anda sudah menyalin tiket atau menyimpan tautan pelacakannya.</p>
      {error && <p className="ticket-delete-error" role="alert">{error}</p>}
      <div className="ticket-delete-actions"><button type="button" autoFocus className="ticket-tool" onClick={() => dialog.current?.close()}>Batal</button><button type="button" className="ticket-tool ticket-tool-danger" onClick={() => { if (onConfirm()) dialog.current?.close(); }}><Trash2 size={16} aria-hidden="true" />Ya, hapus riwayat</button></div>
    </div>
  </dialog>;
}
