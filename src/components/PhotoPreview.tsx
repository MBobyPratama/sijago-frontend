"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, LoaderCircle, X } from "lucide-react";
import "./photo-preview.css";

type Photo = { publicUrl: string; alt?: string };

export function PhotoPreview({ photos, index = 0, label = "Lihat foto laporan", children }: { photos: Photo[]; index?: number; label?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return <>
    <button ref={trigger} type="button" className="photo-preview-trigger" aria-label={label} aria-haspopup="dialog" onClick={() => setOpen(true)}>{children}</button>
    {open && createPortal(<PhotoDialog photos={photos} initialIndex={index} close={() => { setOpen(false); trigger.current?.focus(); }} />, document.body)}
  </>;
}

function PreviewImage({ photo }: { photo: Photo }) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  return <>
    {state === "loading" && <span className="photo-preview-state" role="status"><LoaderCircle size={24} aria-hidden="true" />Memuat foto…</span>}
    {state === "error" ? <p className="photo-preview-state" role="alert">Foto belum dapat dimuat. Tutup preview dan coba kembali.</p> : <img className="photo-preview-image" src={photo.publicUrl} alt={photo.alt || "Bukti kondisi jalan pada laporan"} onLoad={() => setState("ready")} onError={() => setState("error")} />}
  </>;
}

function PhotoDialog({ photos, initialIndex, close }: { photos: Photo[]; initialIndex: number; close: () => void }) {
  const [index, setIndex] = useState(Math.min(initialIndex, photos.length - 1));
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  const move = (direction: number) => setIndex(current => (current + direction + photos.length) % photos.length);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.showModal();
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);
  return <dialog ref={dialog} className="photo-preview-dialog" aria-labelledby={title} onClose={close} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }} onKeyDown={event => {
    if (photos.length > 1 && ["ArrowLeft", "ArrowRight"].includes(event.key)) { event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1); }
  }}>
    <div className="photo-preview-panel">
      <header className="photo-preview-header"><div><h2 id={title}>Foto laporan</h2><p aria-live="polite">Foto {index + 1} dari {photos.length}</p></div><button type="button" autoFocus className="photo-preview-control" aria-label="Tutup preview foto" onClick={() => dialog.current?.close()}><X size={22} aria-hidden="true" /></button></header>
      <div className="photo-preview-stage"><PreviewImage key={photos[index].publicUrl} photo={photos[index]} /></div>
      <footer className="photo-preview-footer"><p>{photos[index].alt || "Bukti kondisi jalan pada laporan"}</p>{photos.length > 1 && <div className="photo-preview-navigation"><button type="button" className="photo-preview-control" aria-label="Foto sebelumnya" onClick={() => move(-1)}><ChevronLeft size={22} aria-hidden="true" /></button><button type="button" className="photo-preview-control" aria-label="Foto berikutnya" onClick={() => move(1)}><ChevronRight size={22} aria-hidden="true" /></button></div>}</footer>
    </div>
  </dialog>;
}
