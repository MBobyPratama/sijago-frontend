"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";

export interface PhotoSuggestion {
 roadDamageVisible:boolean;
 category:"LUBANG"|"RETAK"|"AMBLAS"|"BERGELOMBANG"|"GENANGAN_DRAINASE"|"LAINNYA"|null;
 sizeClass:"KECIL"|"SEDANG"|"BESAR"|null;
 condition:string;
 uncertainty:string;
}
const CATEGORIES:Record<string,string>={LUBANG:"Lubang jalan",RETAK:"Retak",AMBLAS:"Jalan amblas",BERGELOMBANG:"Permukaan bergelombang",GENANGAN_DRAINASE:"Genangan air / drainase buruk",LAINNYA:"Lainnya"};
const SIZES:Record<string,string>={KECIL:"Kecil",SEDANG:"Sedang",BESAR:"Besar"};

export function PhotoAnalysis({image,photoId,onApply}:{image:string|null;photoId?:string;onApply:(suggestion:PhotoSuggestion)=>void}) {
 const [suggestion,setSuggestion]=useState<PhotoSuggestion|null>(null);
 const [loading,setLoading]=useState(false),[error,setError]=useState<string|null>(null),[applied,setApplied]=useState(false);
 const request=useRef<AbortController|null>(null),mounted=useRef(true),busy=useRef(false);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;request.current?.abort();};},[]);
 const analyze=async()=>{
  if(!image||busy.current)return;
  busy.current=true;setLoading(true);setError(null);setSuggestion(null);setApplied(false);
  const controller=new AbortController();request.current=controller;
  const timeout=window.setTimeout(()=>controller.abort(),30000);
  try {
   const response=await fetch('/api/backend/ai/analyze-photo',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(photoId?{photoId}:{image}),signal:controller.signal});
   const result=await response.json();
   if(!response.ok||!result.success||!result.data)throw new Error(result.error?.detail||'Analisis belum berhasil. Silakan isi data secara manual.');
   if(mounted.current)setSuggestion(result.data);
  }catch(err){if(mounted.current)setError(err instanceof Error&&err.name!=='AbortError'?err.message:'Analisis melewati batas waktu. Coba lagi atau isi data secara manual.');}
  finally{window.clearTimeout(timeout);busy.current=false;if(mounted.current)setLoading(false);}
 };
 return <div className="report-ai-assist">
  <div className="report-ai-heading"><div><h3>Bantu isi dari foto</h3><p>AI dapat menyarankan kategori, perkiraan kelas ukuran, dan kondisi yang terlihat. Foto sudah diperiksa saat unggah. Tombol ini meminta saran isian tambahan dari OpenAI.</p></div><button type="button" className="report-secondary" disabled={!image||loading} onClick={analyze} aria-busy={loading}><Sparkles size={16} aria-hidden="true"/>{loading?'Menganalisis foto…':'Analisis foto dengan AI'}</button></div>
  {!image&&<p className="report-helper">Unggah foto terlebih dahulu. Pengisian manual tetap tersedia.</p>}
  <span className="report-ai-status" role="status" aria-live="polite">{loading?'Sedang membaca foto. Isian Anda belum diubah.':applied?'Saran diterapkan. Periksa dan sesuaikan isian sebelum melanjutkan.':''}</span>
  {error&&<p role="alert" className="report-ai-error">{error}</p>}
  {suggestion&&<div className="report-ai-result"><h4>Saran dari foto — perlu Anda periksa</h4><p>{suggestion.uncertainty}</p>{suggestion.roadDamageVisible?<><dl><div><dt>Kategori</dt><dd>{suggestion.category?CATEGORIES[suggestion.category]:'Belum dapat dipastikan; isian Anda dipertahankan.'}</dd></div><div><dt>Kelas ukuran</dt><dd>{suggestion.sizeClass?SIZES[suggestion.sizeClass]+' (perkiraan)':'Skala tidak cukup jelas; isian Anda dipertahankan.'}</dd></div><div><dt>Kondisi di lapangan</dt><dd>{suggestion.condition||'Belum dapat disarankan; isian Anda dipertahankan.'}</dd></div></dl><p className="report-helper">Menerapkan saran akan mengganti isian yang memiliki saran di atas. Lokasi, waktu pengamatan, dan email tetap sama. Ukuran bukan hasil pengukuran.</p><div className="report-ai-actions"><button type="button" className="report-secondary" onClick={()=>setSuggestion(null)}>Abaikan saran</button><button type="button" className="report-primary" disabled={applied||(!suggestion.category&&!suggestion.sizeClass&&!suggestion.condition)} onClick={()=>{onApply(suggestion);setApplied(true);}}> {applied?'Saran diterapkan':'Terapkan saran ke formulir'}</button></div></>:<p>Gunakan foto kerusakan jalan yang lebih jelas, atau lanjutkan mengisi secara manual.</p>}</div>}
 </div>;
}
