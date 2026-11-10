"use client";
import { useEffect, useRef, useState } from "react";
import { Sparkles, GitMerge } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { PhotoPreview } from "@/components/PhotoPreview";

type Suggestion={id:string;ticketCode:string;title:string;status:string;distanceMeters:number;category:string|null;condition:string;observedAt:string|null;submittedAt:string|null;photoUrl:string;match:"LIKELY"|"POSSIBLE";reason:string};
type Result={reportId:string;radiusMeters:number;candidateLimit:number;candidatesFound:number;evaluated:number;skipped:number;checkedAt:string;cached:boolean;sourcePhotoUrl?:string;suggestions:Suggestion[]};
export function DuplicateSuggestions({reportId,disabled,onChoose,canChoose}:{reportId:string;disabled:boolean;onChoose:(code:string)=>void;canChoose:(code:string)=>boolean}){
 const [result,setResult]=useState<Result|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState<string|null>(null),[chosen,setChosen]=useState<string|null>(null);
 const request=useRef<AbortController|null>(null),active=useRef(true),busy=useRef(false);
 useEffect(()=>{active.current=true;return()=>{active.current=false;request.current?.abort();};},[]);
 const check=async()=>{
  if(disabled||busy.current)return;busy.current=true;setLoading(true);setError(null);setResult(null);setChosen(null);
  const controller=new AbortController();request.current=controller;
  try{const response=await apiFetch<Result>(`/admin/reports/${encodeURIComponent(reportId)}/duplicate-suggestions`,{method:"POST",body:JSON.stringify({}),signal:controller.signal});if(!response.success||!response.data)throw new Error(response.error?.detail||"Pemeriksaan belum berhasil. Anda tetap dapat memilih tiket induk secara manual.");if(active.current&&response.data.reportId===reportId)setResult(response.data);}
  catch(err){if(active.current)setError(err instanceof Error&&err.name!=="AbortError"?err.message:"Pemeriksaan dibatalkan. Coba lagi atau pilih tiket secara manual.");}
  finally{busy.current=false;if(active.current)setLoading(false);}
 };
 return <section className="mod-section mod-duplicate-suggestions" aria-labelledby="duplicate-suggestions-heading">
  <div className="mod-decision-heading"><h3 id="duplicate-suggestions-heading">Periksa kemungkinan duplikat</h3><button type="button" className="mod-button" onClick={check} disabled={disabled||loading} aria-busy={loading}><Sparkles size={16} aria-hidden="true"/>{loading?"Membandingkan laporan…":"Cari saran dengan AI"}</button></div>
  <p>Bandingkan maksimal 3 laporan aktif terdekat dalam radius 100 m. AI membantu memeriksa foto dan keterangan; penggabungan tetap keputusan Anda.</p>
  {loading&&<p role="status" className="mod-helper">Memeriksa bukti foto dan membandingkan laporan. Belum ada laporan yang digabung.</p>}
  {error&&<p role="alert" className="mod-notice mod-error">{error}</p>}
  {result&&<div className="mod-duplicate-results"><p role="status" className="mod-helper">{result.candidatesFound===0?"Tidak ada kandidat laporan aktif dalam radius pencarian.":result.evaluated===0?"Kandidat ditemukan, tetapi fotonya belum dapat diperiksa. Pilih tiket secara manual atau coba lagi.":`${result.evaluated} kandidat diperiksa. ${result.suggestions.length} saran untuk ditinjau.`}{result.skipped>0&&` ${result.skipped} kandidat dilewati karena foto tidak tersedia atau belum lolos pemeriksaan.`}{result.cached&&" Memakai hasil pemeriksaan tersimpan."}</p>
   {result.evaluated>0&&result.suggestions.length===0&&<p className="mod-helper">AI belum menemukan indikasi duplikat pada kandidat yang diperiksa. Ini bukan kepastian bahwa laporan unik.</p>}
   {result.suggestions.map(item=><article className="mod-duplicate-candidate" key={item.id}><div className="mod-detail-meta"><strong>{item.ticketCode}</strong><span className="mod-status">{item.match==="LIKELY"?"Indikasi kuat":"Perlu dibandingkan"}</span><span>{item.distanceMeters} m dari titik laporan</span></div><h4>{item.title}</h4><p>{item.reason}</p><div className="mod-evidence"><figure><figcaption>Foto laporan yang diperiksa</figcaption>{result.sourcePhotoUrl&&<PhotoPreview photos={[{publicUrl:result.sourcePhotoUrl,alt:"Bukti foto laporan sumber"}]}><img src={result.sourcePhotoUrl} alt="Bukti foto laporan sumber" loading="lazy"/></PhotoPreview>}</figure><figure><figcaption>Foto kandidat induk</figcaption><PhotoPreview photos={[{publicUrl:item.photoUrl,alt:"Bukti foto kandidat laporan induk"}]}><img src={item.photoUrl} alt="Bukti foto kandidat laporan induk" loading="lazy"/></PhotoPreview></figure></div><p className="mod-helper">Kondisi kandidat: {item.condition||"Tidak ada keterangan tambahan."}</p><p className="mod-helper">Waktu pengamatan: {item.observedAt?new Date(item.observedAt).toLocaleString("id-ID",{timeZone:"Asia/Jakarta"})+" WIB":"Tidak tersedia; pastikan bukan kejadian kerusakan baru."}</p><div className="mod-duplicate-actions"><a href={`/laporan/${encodeURIComponent(item.ticketCode)}`} target="_blank" rel="noopener noreferrer" className="mod-button">Buka detail kandidat</a><button type="button" className="mod-button" disabled={disabled||!canChoose(item.ticketCode)} onClick={()=>{onChoose(item.ticketCode);setChosen(item.ticketCode);}}><GitMerge size={16} aria-hidden="true"/>Gunakan sebagai tiket induk</button></div>{!canChoose(item.ticketCode)&&<p className="mod-helper">Kandidat tidak tersedia dalam pilihan tiket induk. Segarkan antrean.</p>}</article>)}
   {chosen&&<p role="status" className="mod-helper">{chosen} dipilih sebagai tiket induk. Periksa pilihan di bawah lalu tekan Gabung untuk membuka konfirmasi.</p>}
   <p className="mod-helper">Saran bersifat indikatif. Kedekatan GPS dan kemiripan foto belum membuktikan kerusakan yang sama; periksa waktu dan lokasi sebelum menggabungkan.</p>
  </div>}
 </section>;
}
