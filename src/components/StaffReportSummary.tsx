"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Sparkles, FileText } from "lucide-react";
import { apiFetch } from "@/lib/api";
import "./staff-report-summary.css";
interface SummaryResult {reportId:string;ticketCode:string;status:string;method:"AI_EXTRACTIVE"|"BASIC";cached:boolean;notice:string;fields:{label:string;value:string}[];highlights:string[];checkedAt:string;factsUpdatedAt:string}
export function StaffReportSummary({reportId,scope,disabled,originalDetailsId}:{reportId:string;scope:"admin"|"agency";disabled:boolean;originalDetailsId:string}){
 const heading=useId();
 const[result,setResult]=useState<SummaryResult|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState<string|null>(null);
 const request=useRef<AbortController|null>(null),active=useRef(true),busy=useRef(false);
 useEffect(()=>{active.current=true;return()=>{active.current=false;request.current?.abort();};},[]);
 const generate=async()=>{
  if(disabled||busy.current)return;busy.current=true;setLoading(true);setError(null);setResult(null);
  const controller=new AbortController();request.current=controller;
  try{const response=await apiFetch<SummaryResult>(`/${scope}/reports/${encodeURIComponent(reportId)}/summary`,{method:"POST",body:JSON.stringify({}),signal:controller.signal});if(!response.success||!response.data)throw new Error(response.error?.detail||"Ringkasan belum tersedia. Baca Fakta Asal untuk melanjutkan.");if(active.current&&response.data.reportId===reportId)setResult(response.data);}
  catch(err){if(active.current)setError(err instanceof Error&&err.name!=="AbortError"?err.message:"Ringkasan belum dapat dimuat. Silakan baca Fakta Asal.");}
  finally{busy.current=false;if(active.current)setLoading(false);}
 };
 const viewOriginal=()=>{
  const details=document.getElementById(originalDetailsId);if(!(details instanceof HTMLDetailsElement))return;details.open=true;
  details.querySelector('summary')?.focus({preventScroll:true});details.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
 };
 return <section className="staff-report-summary" aria-labelledby={heading}>
  <div className="staff-summary-heading"><div><h3 id={heading}>Ringkasan untuk petugas</h3><p>Baca inti laporan dari Fakta Asal. AI membantu memilih kutipan penting bila keterangannya panjang.</p></div><button type="button" disabled={disabled||loading} onClick={generate} aria-busy={loading}><Sparkles size={16} aria-hidden="true"/>{loading?'Meringkas…':result?'Buat ulang ringkasan':'Buat ringkasan'}</button></div>
  {loading&&<p className="staff-summary-help" role="status">Menyiapkan ringkasan tanpa mengubah isi atau status laporan.</p>}
  {error&&<p role="alert" className="staff-summary-error">{error}</p>}
  {result&&<div className="staff-summary-result"><p className="staff-summary-source" role="status">{result.method==='AI_EXTRACTIVE'?'Kutipan dipilih dengan bantuan AI':'Ringkasan dasar dari Fakta Asal'}{result.cached?' · Hasil tersimpan':''}</p><dl>{result.fields.map(field=><div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl>{result.highlights.length>0&&<div><h4>Inti keterangan warga</h4><ul>{result.highlights.map((text,index)=><li key={index}>{text}</li>)}</ul></div>}<p className="staff-summary-help">{result.notice}</p><button type="button" className="staff-summary-original" onClick={viewOriginal}><FileText size={16} aria-hidden="true"/>Baca Fakta Asal lengkap</button></div>}
 </section>;
}
