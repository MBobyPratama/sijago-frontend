"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import "./report-ticket-picker.css";

export interface TicketOption { id: string; ticketCode: string; title: string; districtName: string }
export function ReportTicketPicker({ id, options, value, onChange, disabled }: { id: string; options: TicketOption[]; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const selected = options.find(option => option.ticketCode === value);
  const term = query.trim().toLowerCase();
  const filtered = options.filter(option => `${option.ticketCode} ${option.title} ${option.districtName}`.toLowerCase().includes(term));
  const activeIndex = Math.min(active, Math.max(filtered.length - 1, 0));
  const close = (restoreFocus = false) => { setOpen(false); if (restoreFocus) trigger.current?.focus(); };
  const choose = (option: TicketOption) => { onChange(option.ticketCode); close(true); };
  useEffect(() => {
    if (!open) return;
    search.current?.focus();
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  useEffect(() => { if (open) document.getElementById(`${listId}-${activeIndex}`)?.scrollIntoView({ block: "nearest" }); }, [activeIndex, listId, open, query]);
  return <div ref={root} className="report-ticket-picker" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close(); }}>
    <button id={id} ref={trigger} type="button" className="report-ticket-picker-trigger" disabled={disabled} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listId : undefined} onClick={() => { setQuery(""); setActive(0); setOpen(!open); }} onKeyDown={event => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setQuery(""); setActive(0); setOpen(true); } }}><span>{selected?.ticketCode || "Pilih tiket induk"}</span><ChevronDown size={17} aria-hidden="true" /></button>
    {open && <div className="report-ticket-picker-menu">
      <div className="report-ticket-picker-search"><Search size={16} aria-hidden="true" /><input ref={search} type="search" role="combobox" aria-label="Cari tiket induk berdasarkan kode, judul, atau kecamatan" aria-expanded="true" aria-controls={listId} aria-autocomplete="list" aria-activedescendant={filtered.length ? `${listId}-${activeIndex}` : undefined} placeholder="Cari kode, judul, kecamatan…" value={query} onChange={event => { setQuery(event.target.value); setActive(0); }} onKeyDown={event => {
        if (event.key === "Escape") { event.preventDefault(); close(true); }
        if (["ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); setActive(current => Math.max(0, Math.min(filtered.length - 1, current + (event.key === "ArrowDown" ? 1 : -1)))); }
        if (event.key === "Enter") { event.preventDefault(); if (filtered[activeIndex]) choose(filtered[activeIndex]); }
      }} /></div>
      <ul id={listId} role="listbox" aria-label="Daftar tiket induk" className="report-ticket-picker-options">{filtered.map((option, index) => <li id={`${listId}-${index}`} key={option.id} role="option" aria-selected={option.ticketCode === value} className={index === activeIndex ? "is-active" : undefined} onMouseDown={event => event.preventDefault()} onMouseEnter={() => setActive(index)} onClick={() => choose(option)}><div><strong>{option.ticketCode}</strong><span>{option.title}</span><small>{option.districtName}</small></div>{option.ticketCode === value && <Check size={17} aria-hidden="true" />}</li>)}</ul>
      {!filtered.length && <p className="report-ticket-picker-empty" role="status">{options.length ? "Tidak ada tiket yang cocok." : "Belum ada laporan lain yang dapat dipilih."}</p>}
    </div>}
  </div>;
}
