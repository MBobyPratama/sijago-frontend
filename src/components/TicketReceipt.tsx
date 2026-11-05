"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Share2, BookmarkCheck, Mail } from "lucide-react";
import { copyText, saveTicket, trackingPath } from "@/lib/saved-tickets";
import "./ticket-tools.css";

export type ReceiptEmailStatus = "SENT" | "FAILED" | "PENDING" | "NOT_REQUESTED";
export function TicketReceipt({ ticketCode, emailStatus }: { ticketCode: string; emailStatus: ReceiptEmailStatus }) {
  const [saved, setSaved] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const path = trackingPath(ticketCode);
  useEffect(() => { setSaved(saveTicket(ticketCode)); }, [ticketCode]);
  const act = async (share: boolean) => {
    if (busy) return;
    setBusy(true); setMessage("");
    try {
      const url = new URL(path, window.location.origin).href;
      if (share && navigator.share) { await navigator.share({ title: `Tiket SIJAGO ${ticketCode}`, text: `Pantau perkembangan laporan ${ticketCode}`, url }); setMessage("Tautan pelacakan telah dibagikan."); }
      else { await copyText(share ? url : ticketCode); setMessage(share ? "Tautan pelacakan disalin. Tempel di aplikasi pesan untuk membagikannya." : "Kode tiket berhasil disalin."); }
    } catch (error) { if (!(error instanceof Error && error.name === "AbortError")) setMessage("Belum dapat menyalin atau membagikan. Anda dapat menyalin kode tiket dan tautan di bawah secara manual."); }
    finally { setBusy(false); }
  };
  return <div className="ticket-receipt">
    <div className="report-ticket"><span>Kode tiket Anda</span><strong>{ticketCode}</strong><span>Status: Menunggu verifikasi</span></div>
    <p className="ticket-device-note" role="status"><BookmarkCheck size={17} aria-hidden="true" />{saved === null ? "Menyiapkan penyimpanan tiket…" : saved ? "Tiket tersimpan di browser ini. Temukan kembali di halaman Lacak laporan." : "Browser ini tidak dapat menyimpan tiket. Salin kode atau bagikan tautannya agar tidak hilang."}</p>
    {emailStatus !== "NOT_REQUESTED" && <p className="ticket-device-note"><Mail size={17} aria-hidden="true" />{emailStatus === "SENT" ? "Tiket dan tautan pelacakan telah dikirim melalui layanan email. Periksa kotak masuk atau spam Anda." : emailStatus === "PENDING" ? "Pengiriman email belum dikonfirmasi. Simpan tiket ini terlebih dahulu." : "Pengiriman email belum berhasil dikonfirmasi. Laporan tetap terkirim; simpan tiket ini terlebih dahulu."}</p>}
    <div className="ticket-tools-actions"><Link href={path} className="ticket-tool ticket-tool-primary">Lacak tiket</Link><button type="button" className="ticket-tool" disabled={busy} onClick={() => act(false)}><Copy size={17} aria-hidden="true" />Salin tiket</button><button type="button" className="ticket-tool" disabled={busy} onClick={() => act(true)}><Share2 size={17} aria-hidden="true" />Bagikan tautan pelacakan</button></div>
    <p className="ticket-feedback" role="status" aria-live="polite">{message}</p>
    <Link href={path} className="ticket-manual-link">{path}</Link>
  </div>;
}
