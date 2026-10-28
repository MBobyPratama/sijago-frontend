"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Save, CheckCircle2, RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";
import "./pengaturan.css";

const DEFAULT_CONFIGS = {
  duplicateRadiusMeters: "30", aiTimeoutMs: "9000", aiMaxRegenerate: "5", signoffMonitoringDays: "30", signoffReopenMinVotes: "3", signoffReopenBadRatioPct: "50", redZoneRainfallThresholdMm: "50",
};
type Configs = typeof DEFAULT_CONFIGS;
type ConfigKey = keyof Configs;
type ConfigRow = {key:string;valueJson?:unknown;value?:unknown;description?:string;updatedAt?:string};
const FIELDS: {id:ConfigKey;key:string;label:string;unit:string;help:string;min:number;max?:number;integer?:boolean}[] = [
  {id:"duplicateRadiusMeters",key:"duplicate_radius_meters",label:"Radius deteksi duplikat",unit:"meter",help:"Jarak sekitar titik GPS untuk mencari kandidat laporan yang sama.",min:0},
  {id:"aiTimeoutMs",key:"ai_timeout_ms",label:"Batas waktu pembuatan draf",unit:"milidetik",help:"Batas panggilan OpenAI gpt-6-luna sebelum beralih ke Draf Template.",min:1,integer:true},
  {id:"aiMaxRegenerate",key:"ai_max_regenerate_per_report",label:"Batas pembuatan ulang draf",unit:"kali / laporan",help:"Jumlah maksimal pembuatan ulang draf AI untuk satu laporan.",min:0,integer:true},
  {id:"signoffMonitoringDays",key:"signoff_monitoring_days",label:"Masa pemantauan perbaikan",unit:"hari",help:"Durasi Community Sign-Off setelah laporan berstatus Selesai.",min:1,integer:true},
  {id:"signoffReopenMinVotes",key:"signoff_reopen_min_votes",label:"Suara minimum buka kembali",unit:"suara",help:"Jumlah suara minimal sebelum ambang Cepat Rusak dapat memicu pembukaan kembali.",min:1,integer:true},
  {id:"signoffReopenBadRatioPct",key:"signoff_reopen_bad_ratio",label:"Ambang suara Cepat Rusak",unit:"persen",help:"Laporan dibuka kembali jika proporsi Cepat Rusak melebihi ambang ini dan suara minimum terpenuhi.",min:0,max:100},
  {id:"redZoneRainfallThresholdMm",key:"red_zone_rainfall_threshold_mm",label:"Ambang hujan zona merah",unit:"mm",help:"Ambang curah hujan untuk klasifikasi zona merah Weather-Road Intelligence.",min:0},
];
const GROUPS = [
  {id:"duplicates",title:"Deteksi duplikat",description:"Atur jangkauan pencarian laporan serupa.",fields:["duplicateRadiusMeters"]},
  {id:"ai",title:"Pembuatan draf AI",description:"Batasi waktu proses dan jumlah pembuatan ulang draf.",fields:["aiTimeoutMs","aiMaxRegenerate"]},
  {id:"monitoring",title:"Pemantauan perbaikan",description:"Tentukan durasi pemantauan dan ambang penilaian warga.",fields:["signoffMonitoringDays","signoffReopenMinVotes","signoffReopenBadRatioPct"]},
  {id:"weather",title:"Cuaca dan zona merah",description:"Sesuaikan ambang hujan untuk analisis kondisi jalan.",fields:["redZoneRainfallThresholdMm"]},
];
const validate = (id:ConfigKey,value:string) => {
  const field = FIELDS.find(item=>item.id===id)!;
  if (!value.trim()) return "Nilai wajib diisi.";
  const number = Number(value);
  if (!Number.isFinite(number)) return "Masukkan angka yang valid.";
  if (number<field.min) return `Nilai minimal ${field.min} ${field.unit}.`;
  if (field.max!==undefined && number>field.max) return `Nilai maksimal ${field.max} ${field.unit}.`;
  if (field.integer && !Number.isInteger(number)) return "Gunakan bilangan bulat.";
  return "";
};
const parseRows = (rows:ConfigRow[]) => {
  const map = Object.fromEntries(rows.map(row=>[row.key,row.valueJson ?? row.value]));
  const values:Configs = {...DEFAULT_CONFIGS};
  const missing:ConfigKey[]=[];
  for (const field of FIELDS) {
    let value = map[field.key];
    if (field.id==="aiMaxRegenerate" && value==null) value=map.ai_max_regenerate;
    if (field.id==="signoffReopenBadRatioPct") {
      value=map.signoff_reopen_bad_ratio;
      if (value!=null) value=Number(value)*100;
      else value=map.signoff_reopen_bad_ratio_pct;
    }
    if (value==null) missing.push(field.id);
    else values[field.id]=String(value);
  }
  return {values,missing};
};

export default function AdminPengaturanPage() {
  const [saved,setSaved]=useState(false);
  const [isLiveDb,setIsLiveDb]=useState(false);
  const [saving,setSaving]=useState(false);
  const [loading,setLoading]=useState(true);
  const [configs,setConfigs]=useState<Configs>({...DEFAULT_CONFIGS});
  const [baseline,setBaseline]=useState<Configs>({...DEFAULT_CONFIGS});
  const [missing,setMissing]=useState<ConfigKey[]>([]);
  const [error,setError]=useState<string | null>(null);
  const [errors,setErrors]=useState<Partial<Record<ConfigKey,string>>>({});
  const requestVersion=useRef(0);
  const savingRef=useRef(false);
  const hasLiveData=useRef(false);
  const availableKeys=useRef(new Set<string>());
  const changed=FIELDS.filter(field=>configs[field.id]!==baseline[field.id]);
  const dirty=changed.length>0;
  const fetchConfigs=useCallback(async()=>{
    const version=++requestVersion.current; setLoading(true);setError(null);setSaved(false);
    try {
      const res=await apiFetch<ConfigRow[]>("/admin/config");
      if (version!==requestVersion.current) return;
      if (!res.success || !Array.isArray(res.data)) throw new Error(res.error?.detail || "Pengaturan belum dapat dimuat.");
      const parsed=parseRows(res.data);
      availableKeys.current=new Set(res.data.map(row=>row.key));
      setConfigs(parsed.values);setBaseline(parsed.values);setMissing(parsed.missing);setIsLiveDb(true);hasLiveData.current=true;setErrors({});
    } catch(err) {
      if (version===requestVersion.current) setError(err instanceof Error?err.message:"Koneksi terputus. Coba muat ulang.");
    } finally { if (version===requestVersion.current) setLoading(false); }
  },[]);
  useEffect(()=>{fetchConfigs();return()=>{requestVersion.current++;};},[fetchConfigs]);
  useEffect(()=>{
    if (!dirty) return;
    const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();};
    const guardNavigation=(event:MouseEvent)=>{
      if (event.defaultPrevented || event.button!==0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const link=(event.target as Element)?.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target==="_blank" || link.hasAttribute("download")) return;
      const target=new URL(link.href,window.location.href);
      if (target.origin!==window.location.origin || (target.pathname===window.location.pathname && target.search===window.location.search)) return;
      if (!window.confirm("Perubahan belum disimpan. Tinggalkan halaman dan buang perubahan?")) { event.preventDefault();event.stopImmediatePropagation(); }
    };
    window.addEventListener("beforeunload",warn);
    document.addEventListener("click",guardNavigation,true);
    return()=>{window.removeEventListener("beforeunload",warn);document.removeEventListener("click",guardNavigation,true);};
  },[dirty]);
  const updateConfig=(id:ConfigKey,value:string)=>{
    setConfigs(prev=>({...prev,[id]:value}));setSaved(false);
    if (errors[id]) setErrors(prev=>({...prev,[id]:validate(id,value)}));
  };
  const handleSave=async()=>{
    if (savingRef.current || loading) return;
    setSaved(false);setError(null);
    const nextErrors=Object.fromEntries(FIELDS.map(field=>[field.id,validate(field.id,configs[field.id])]).filter(([,message])=>message));
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {document.getElementById(Object.keys(nextErrors)[0])?.focus();return;}
    if (!isLiveDb) {setError("Nilai acuan belum terhubung ke server. Muat ulang pengaturan sebelum menyimpan.");return;}
    if (!dirty) return;
    const updates:Record<string,string>={};
    for (const field of changed) {
      updates[field.key]=field.id==="signoffReopenBadRatioPct"?String(Number(configs[field.id])/100):configs[field.id];
      // Keep existing legacy aliases synchronized when they already exist in this database.
      if (field.id==="aiMaxRegenerate" && availableKeys.current.has("ai_max_regenerate")) updates.ai_max_regenerate=configs[field.id];
      if (field.id==="signoffReopenBadRatioPct" && availableKeys.current.has("signoff_reopen_bad_ratio_pct")) updates.signoff_reopen_bad_ratio_pct=configs[field.id];
    }
    savingRef.current=true;setSaving(true);
    try {
      const res=await apiFetch("/admin/config",{method:"PUT",body:JSON.stringify({configs:updates})});
      if (!res.success) throw new Error(res.error?.detail || "Pengaturan belum tersimpan. Coba kembali.");
      setBaseline({...configs});setMissing(prev=>prev.filter(id=>!changed.some(field=>field.id===id)));setSaved(true);setIsLiveDb(true);
    } catch(err) {setError(err instanceof Error?err.message:"Koneksi terputus. Penyimpanan belum dikonfirmasi server. Muat ulang untuk memeriksa hasil.");}
    finally {savingRef.current=false;setSaving(false);}
  };
  const reload=()=>{if(dirty&&!window.confirm("Muat ulang akan membuang perubahan yang belum disimpan. Lanjutkan?"))return;fetchConfigs();};

  return <main className="settings-page"><div className="settings-container">
    <header className="settings-heading"><div><h1>Pengaturan sistem</h1><p>Sesuaikan parameter operasional SIJAGO tanpa mengubah kode aplikasi.</p></div><button type="button" className="settings-button" onClick={reload} disabled={loading||saving}><RefreshCw size={16} aria-hidden="true" />{loading?"Memuat pengaturan…":"Muat ulang"}</button></header>
    <div className="settings-context"><span role="status" className={isLiveDb&&!error?"settings-source-live":"settings-source-warning"}>{isLiveDb?"Nilai dari server":"Nilai acuan"}</span><span><ShieldCheck size={16} aria-hidden="true" />Pengaturan untuk Super Admin</span><Link href="/admin/audit">Lihat riwayat perubahan</Link></div>
    {error&&<div role="alert" className="settings-notice settings-warning"><AlertTriangle size={18} aria-hidden="true" /><p>{error} {!hasLiveData.current&&"Nilai acuan ditampilkan sebagai referensi; belum tersimpan ke server."}</p></div>}
    {saved&&<div role="status" className="settings-notice settings-success"><CheckCircle2 size={18} aria-hidden="true" /><p>Parameter berhasil diperbarui. Perubahan dicatat sebagai CONFIG_UPDATED di audit log.</p></div>}
    {!loading&&isLiveDb&&missing.length>0&&<p className="settings-missing-note">{missing.length} parameter belum tersedia di server dan memakai nilai acuan. Hanya parameter yang Anda ubah akan disimpan.</p>}
    <div className="settings-layout"><aside className="settings-index" aria-label="Kelompok pengaturan"><nav>{GROUPS.map(group=><a key={group.id} href={`#settings-${group.id}`}>{group.title}</a>)}</nav><p>Nilai baru ditujukan untuk kejadian berikutnya. Perubahan tidak mengubah Fakta Asal atau draf laporan yang sudah tersimpan.</p><details><summary>Kunci konfigurasi teknis</summary><p>Parameter disimpan pada system_config. Nama kunci ditampilkan di bawah masing-masing isian untuk kebutuhan teknis.</p></details></aside>
    <form className="settings-form" onSubmit={e=>{e.preventDefault();handleSave();}} noValidate aria-busy={loading||saving}>
      {loading?<div className="settings-loading" role="status"><span /><span /><span /><p>Memuat parameter dari server…</p></div>:GROUPS.map(group=><section key={group.id} id={`settings-${group.id}`} className="settings-section" aria-labelledby={`heading-${group.id}`}><div className="settings-section-heading"><h2 id={`heading-${group.id}`}>{group.title}</h2><p>{group.description}</p></div><div className="settings-fields">{group.fields.map(id=>{const field=FIELDS.find(item=>item.id===id)!;return <div className="settings-field" key={id}><div className="settings-label"><label htmlFor={id}>{field.label}</label>{missing.includes(field.id)&&<span>Nilai acuan</span>}</div><div className="settings-input-wrap"><input id={id} name={field.key} type="number" inputMode={field.integer?"numeric":"decimal"} min={field.min} max={field.max} step={field.integer?1:"any"} value={configs[field.id]} onChange={e=>updateConfig(field.id,e.target.value)} onBlur={()=>setErrors(prev=>({...prev,[field.id]:validate(field.id,configs[field.id])}))} disabled={saving} aria-invalid={Boolean(errors[field.id])} aria-describedby={`${id}-help ${id}-unit ${id}-error`} /><span id={`${id}-unit`}>{field.unit}</span></div><p id={`${id}-help`} className="settings-help">{field.help}</p><code className="settings-key">{field.key}</code><p id={`${id}-error`} className="settings-field-error" aria-live="polite">{errors[field.id]||""}</p></div>;})}</div></section>)}
      <div className="settings-save-bar"><div><strong>{saved?"Semua perubahan tersimpan":dirty?`${changed.length} parameter belum disimpan`:"Belum ada perubahan"}</strong><p>Perubahan dicatat sebagai CONFIG_UPDATED.</p></div><div className="settings-save-actions"><button type="button" className="settings-button" disabled={!dirty||saving||loading} onClick={()=>{setConfigs({...baseline});setErrors({});setSaved(false);setError(null);}}>Batalkan perubahan</button><button type="submit" className="settings-button settings-primary" disabled={saving||loading||!dirty}><Save size={16} aria-hidden="true" />{saving?"Menyimpan…":"Simpan pengaturan"}</button></div></div>
    </form></div>
  </div></main>;
}
