"use client";

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { MOCK_REPORTS, ReportItem } from "@/lib/mockData";
import { apiFetch } from "@/lib/api";
import { Camera, CheckCircle2, CornerUpLeft, AlertTriangle, RefreshCw, Search } from "lucide-react";
import "./laporan-instansi.css";

const AGENCIES = [
  {code:"PUPR_KOTA_BOGOR",name:"Dinas PUPR Kota Bogor",scope:"Jalan Kota",match:"PUPR"},
  {code:"BINAMARGA_JABAR",name:"Dinas Bina Marga Pemprov Jabar",scope:"Jalan Provinsi",match:"Bina Marga"},
  {code:"BBPJN_NASIONAL",name:"BBPJN Nasional DKI - Jabar",scope:"Jalan Nasional",match:"BBPJN"},
];
const STATUS_LABELS:Record<string,string>={MENUNGGU_VERIFIKASI:"Menunggu verifikasi",TERVERIFIKASI:"Terverifikasi",DITERUSKAN:"Diteruskan",DIPROSES:"Diproses",SELESAI:"Selesai",DIBUKA_KEMBALI:"Dibuka kembali",DITUTUP:"Ditutup",DITOLAK:"Ditolak",DUPLIKAT:"Duplikat"};
type Photo={id:string;kind:string;publicUrl:string};
type AgencyReport=Omit<ReportItem,"status">&{status:string;photos?:Photo[];assignedAgencyCode?:string};
const sampleReports=(code:string)=>MOCK_REPORTS.filter(rep=>rep.assignedAgency?.includes(AGENCIES.find(agency=>agency.code===code)!.match));
const cleanLabel=(text:string)=>text.replace(/^[^\p{L}\p{N}\[]+/u,"");

export default function PortalInstansiPage(){
  const [selectedAgencyCode,setSelectedAgencyCode]=useState("PUPR_KOTA_BOGOR");
  const [reports,setReports]=useState<AgencyReport[]>([]);
  const [selectedReportId,setSelectedReportId]=useState("");
  const [isLiveDb,setIsLiveDb]=useState(false);
  const [loading,setLoading]=useState(true);
  const [queueError,setQueueError]=useState<string|null>(null);
  const [newStatus,setNewStatus]=useState<"DIPROSES"|"SELESAI">("SELESAI");
  // Existing demo controls are intentionally separated from actual completion evidence.
  const [afterPhotoUploaded,setAfterPhotoUploaded]=useState(true);
  const [exifWarningSim,setExifWarningSim]=useState(false);
  const [returnReason,setReturnReason]=useState("");
  const [plannedDate,setPlannedDate]=useState("");
  const [note,setNote]=useState("");
  const [actionMessage,setActionMessage]=useState<string|null>(null);
  const [actionError,setActionError]=useState(false);
  const [submitting,setSubmitting]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [uploadError,setUploadError]=useState<string|null>(null);
  const [photo,setPhoto]=useState<Photo|null>(null);
  const [photoDistance,setPhotoDistance]=useState<number|null>(null);
  const [query,setQuery]=useState("");
  const [statusFilter,setStatusFilter]=useState("ALL");
  const [showMobileList,setShowMobileList]=useState(false);
  const busy=useRef(false);
  const version=useRef(0);
  const liveAgency=useRef<string|null>(null);
  const loadedAgency=useRef<string|null>(null);
  const report=reports.find(item=>item.id===selectedReportId);
  const notify=(message:string,error=false)=>{setActionMessage(message);setActionError(error);};
  const fetchAgencyReports=useCallback(async()=>{
    const request=++version.current;
    const switching=loadedAgency.current!==selectedAgencyCode;
    if(!busy.current)setLoading(true);
    setQueueError(null);
    if(switching){liveAgency.current=null;setReports([]);setSelectedReportId("");setIsLiveDb(false);}
    try{
      const res=await apiFetch<AgencyReport[]>(`/agency/reports?agencyCode=${encodeURIComponent(selectedAgencyCode)}`);
      if(request!==version.current)return;
      if(!res.success||!Array.isArray(res.data))throw new Error(res.error?.detail||"Laporan instansi belum dapat dimuat.");
      setReports(res.data);setSelectedReportId(prev=>res.data!.some(item=>item.id===prev)?prev:res.data![0]?.id||"");setIsLiveDb(true);liveAgency.current=selectedAgencyCode;loadedAgency.current=selectedAgencyCode;
    }catch(error){
      if(request!==version.current)return;
      setQueueError(error instanceof Error?error.message:"Koneksi ke server terputus.");
      if(liveAgency.current!==selectedAgencyCode){const samples=sampleReports(selectedAgencyCode);setReports(samples);setSelectedReportId(samples[0]?.id||"");setIsLiveDb(false);loadedAgency.current=selectedAgencyCode;}
    }finally{if(request===version.current)setLoading(false);}
  },[selectedAgencyCode]);
  useEffect(()=>{fetchAgencyReports();return()=>{version.current++;};},[fetchAgencyReports]);
  useEffect(()=>{setNewStatus("SELESAI");setReturnReason("");setPlannedDate("");setNote("");setPhoto(null);setPhotoDistance(null);setUploadError(null);setExifWarningSim(false);},[selectedReportId,selectedAgencyCode]);
  useEffect(()=>{setActionMessage(null);},[selectedAgencyCode]);
  const shownReports=useMemo(()=>reports.filter(item=>(statusFilter==="ALL"||item.status===statusFilter)&&`${item.ticketCode} ${item.title} ${item.districtName}`.toLowerCase().includes(query.trim().toLowerCase())),[reports,statusFilter,query]);
  const selectReport=(id:string)=>{
    setSelectedReportId(id);
    if(window.matchMedia("(max-width: 850px)").matches)requestAnimationFrame(()=>{
      const heading=document.getElementById("agency-detail-heading");heading?.focus({preventScroll:true});heading?.scrollIntoView({block:"start",behavior:"instant"});
    });
  };
  const existingAfter=report?.photos?.find(item=>item.kind==="AFTER");
  const evidence=photo||existingAfter;
  const beforePhotos=report?.photos?.filter(item=>item.kind==="BEFORE"||item.kind==="REPORT")||[];
  const disabled=submitting||uploading||loading;

  const handleFileUpload=async(event:React.ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];event.target.value="";
    if(!file||!report||busy.current)return;
    if(!isLiveDb){setUploadError("Unggah memerlukan laporan yang terhubung ke server.");return;}
    if(!["image/jpeg","image/png","image/webp"].includes(file.type)){setUploadError("Gunakan foto JPG, PNG, atau WebP.");return;}
    busy.current=true;setUploading(true);setUploadError(null);
    try{
      const [{default:exifr},{default:compress}]=await Promise.all([import("exifr"),import("browser-image-compression")]);
      const gps=await exifr.gps(file).catch(()=>null);
      const compressed=await compress(file,{maxSizeMB:1.2,maxWidthOrHeight:1600,useWebWorker:true});
      const signed=await apiFetch<{configured:boolean;cloudName:string;apiKey:string;timestamp:number;folder:string;signature:string}>("/uploads/cloudinary-sign",{method:"POST",body:JSON.stringify({})});
      if(!signed.success||!signed.data?.configured)throw new Error("Layanan unggah belum tersedia. Foto belum diunggah; coba kembali setelah Cloudinary terhubung.");
      const data=new FormData();data.append("file",compressed);data.append("api_key",signed.data.apiKey);data.append("timestamp",String(signed.data.timestamp));data.append("signature",signed.data.signature);data.append("folder",signed.data.folder);
      const response=await fetch(`https://api.cloudinary.com/v1_1/${signed.data.cloudName}/image/upload`,{method:"POST",body:data});
      if(!response.ok)throw new Error("Unggah foto gagal. Coba kembali.");
      const uploaded=await response.json() as {public_id:string;secure_url:string};
      if(!uploaded.public_id||!uploaded.secure_url)throw new Error("Layanan foto belum mengembalikan bukti unggah yang valid.");
      const registered=await apiFetch<{photo:{id:string;publicUrl:string;exifDistanceMeters?:string|null}}>("/uploads/cloudinary-sign",{method:"POST",body:JSON.stringify({registerPhoto:true,reportId:report.id,kind:"AFTER",cloudinaryPublicId:uploaded.public_id,originalSecureUrl:uploaded.secure_url,reportLat:report.lat,reportLng:report.lng,exifLat:gps?.latitude??null,exifLng:gps?.longitude??null})});
      if(!registered.success||!registered.data?.photo?.id)throw new Error(registered.error?.detail||"Foto terunggah, tetapi belum tercatat pada laporan. Coba kembali.");
      const saved=registered.data.photo;const storedPhoto:Photo={id:saved.id,kind:"AFTER",publicUrl:saved.publicUrl||uploaded.secure_url};setPhoto(storedPhoto);setReports(prev=>prev.map(item=>item.id===report.id?{...item,photos:[...(item.photos||[]),storedPhoto]}:item));setPhotoDistance(saved.exifDistanceMeters!=null?Number(saved.exifDistanceMeters):null);
    }catch(error){setUploadError(error instanceof Error?error.message:"Foto belum berhasil diunggah.");}finally{busy.current=false;setUploading(false);}
  };
  const handleUpdateStatus=async()=>{
    if(!report||busy.current||loading)return;
    if(!isLiveDb){notify("Data contoh: perubahan tidak disimpan. Segarkan untuk menghubungkan server.",true);return;}
    if(newStatus==="SELESAI"&&!evidence){notify("Unggah minimal satu foto sesudah perbaikan sebelum memilih Selesai.",true);return;}
    busy.current=true;setSubmitting(true);setActionMessage(null);
    try{
      const res=await apiFetch<{id:string;status:string;monitoringEndsAt:string|null}>(`/agency/reports/${encodeURIComponent(report.id)}/status`,{method:"POST",body:JSON.stringify({newStatus,agencyCode:selectedAgencyCode,plannedDate:plannedDate||undefined,afterPhotoUploaded:Boolean(evidence),afterPhotoUrl:evidence?.publicUrl,exifDistanceMeters:photoDistance??undefined,note:note.trim()||`Status diperbarui menjadi ${newStatus} oleh ${selectedAgencyCode}`})});
      if(!res.success||!res.data)throw new Error(res.error?.detail||"Pembaruan status belum berhasil.");
      notify(`Status ${report.ticketCode} diperbarui menjadi ${STATUS_LABELS[res.data.status]||res.data.status}.${res.data.status==="SELESAI"?" Masa pemantauan Community Sign-Off dimulai.":""}`);await fetchAgencyReports();
    }catch(error){notify(error instanceof Error?error.message:"Koneksi terputus. Status belum dikonfirmasi server; segarkan sebelum mencoba kembali.",true);}finally{busy.current=false;setSubmitting(false);}
  };
  const handleReturnToAdmin=async()=>{
    if(!report||busy.current||loading)return;
    if(!returnReason.trim()){notify("Isi alasan pengembalian terlebih dahulu.",true);document.getElementById("return-reason")?.focus();return;}
    if(!isLiveDb){notify("Data contoh: laporan tidak dikembalikan ke server.",true);return;}
    if(!window.confirm(`Kembalikan ${report.ticketCode} ke Admin SIJAGO untuk penentuan instansi ulang?`))return;
    busy.current=true;setSubmitting(true);setActionMessage(null);
    try{
      const res=await apiFetch<{id:string;status:string}>(`/agency/reports/${encodeURIComponent(report.id)}/return`,{method:"POST",body:JSON.stringify({agencyCode:selectedAgencyCode,reason:returnReason.trim()})});
      if(!res.success)throw new Error(res.error?.detail||"Laporan belum berhasil dikembalikan.");
      notify(`Laporan ${report.ticketCode} dikembalikan ke antrean Admin SIJAGO untuk penentuan instansi ulang (RETURNED_BY_AGENCY).`);setReturnReason("");await fetchAgencyReports();
    }catch(error){notify(error instanceof Error?error.message:"Koneksi terputus. Pengembalian belum dikonfirmasi server.",true);}finally{busy.current=false;setSubmitting(false);}
  };

  return <main className="agency-page"><div className="agency-container">
    <header className="agency-heading"><div><h1>Tindak lanjut laporan</h1><p>Perbarui penanganan jalan dan sertakan bukti perbaikan untuk warga.</p></div><button type="button" className="agency-button" disabled={disabled} onClick={fetchAgencyReports}><RefreshCw size={16} aria-hidden="true" />{loading?"Memuat laporan…":"Segarkan laporan"}</button></header>
    <div className="agency-toolbar"><div className="agency-field"><label htmlFor="active-agency">Instansi aktif (simulasi akun)</label><select id="active-agency" value={selectedAgencyCode} onChange={(e)=>{setSelectedAgencyCode(e.target.value);setQuery("");setStatusFilter("ALL");}} disabled={submitting||uploading}>{AGENCIES.map(agency=><option value={agency.code} key={agency.code}>{agency.name} ({agency.scope})</option>)}</select></div><span role="status" className={isLiveDb&&!queueError?"agency-live":"agency-warning"}>{queueError&&isLiveDb?"Data terakhir, koneksi gagal":isLiveDb?"Data dari server":"Data contoh"}</span><p>Pilihan ini untuk simulasi instansi. Daftar diminta sesuai kode instansi yang aktif.</p></div>
    {queueError&&<div role="alert" className="agency-notice agency-warning"><AlertTriangle size={18} aria-hidden="true" /><p>{queueError} {isLiveDb?"Data terakhir tetap ditampilkan.":"Menampilkan contoh sesuai instansi; tindakan tidak disimpan."}</p></div>}
    {actionMessage&&<div role={actionError?"alert":"status"} className={`agency-notice ${actionError?"agency-error":"agency-success"}`}><p>{actionMessage}</p><button type="button" className="agency-button" onClick={() => setActionMessage(null)}>Tutup</button></div>}
    <div className="agency-layout"><section className="agency-queue" aria-labelledby="queue-heading"><div className="agency-queue-heading"><h2 id="queue-heading">Laporan instansi</h2><span>{reports.length} laporan dimuat</span></div><div className="agency-filters"><div className="agency-field agency-search"><label htmlFor="agency-search">Cari laporan</label><div><Search size={16} aria-hidden="true" /><input id="agency-search" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Kode tiket, judul, kecamatan" /></div></div><div className="agency-field"><label htmlFor="agency-status-filter">Filter status</label><select id="agency-status-filter" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="ALL">Semua status</option>{Object.entries(STATUS_LABELS).map(([code,label])=><option value={code} key={code}>{label}</option>)}</select></div><div className="agency-field"><label htmlFor="selected-report">Pilih tiket</label><select id="selected-report" value={selectedReportId} onChange={(e) => selectReport(e.target.value)} disabled={disabled||!reports.length}><option value="" disabled>Pilih laporan</option>{reports.map(item=><option value={item.id} key={item.id}>{item.ticketCode} ({STATUS_LABELS[item.status]||item.status})</option>)}</select></div></div><button type="button" className="agency-button agency-mobile-list-toggle" aria-expanded={showMobileList} aria-controls="agency-records" onClick={()=>setShowMobileList(!showMobileList)}>{showMobileList?"Sembunyikan daftar":`Tampilkan daftar (${shownReports.length})`}</button><div id="agency-records" className={`agency-records ${showMobileList||!shownReports.length||loading?"is-expanded":""}`}>{loading?<div className="agency-empty" role="status">Memuat laporan instansi…</div>:shownReports.length?shownReports.map(item=><button key={item.id} type="button" aria-pressed={item.id===selectedReportId} disabled={submitting||uploading} onClick={()=>selectReport(item.id)} className="agency-record"><span>{item.ticketCode}</span><strong>{item.title}</strong><span className={`agency-status status-${item.status}`}>{STATUS_LABELS[item.status]||item.status}</span><span>{item.districtName}</span></button>):<div className="agency-empty"><h3>{reports.length?"Tidak ada hasil yang cocok":"Belum ada laporan"}</h3><p>{reports.length?"Ubah pencarian atau filter status.":"Laporan yang diteruskan ke instansi ini akan muncul di sini."}</p>{reports.length>0&&<button type="button" className="agency-button" onClick={()=>{setQuery("");setStatusFilter("ALL");}}>Reset filter</button>}</div>}</div></section>
    <section className="agency-detail" aria-label="Detail dan tindak lanjut" aria-busy={loading}>{loading?<div className="agency-loading"><span/><span/><p>Menyiapkan detail laporan…</p></div>:!report?<div className="agency-empty"><h2>Pilih laporan untuk ditindaklanjuti</h2><p>Detail dan form akan muncul setelah laporan tersedia.</p></div>:<><header className="agency-report-heading"><a className="agency-back" href="#queue-heading">Kembali ke daftar</a><div><span>{report.ticketCode}</span><span className={`agency-status status-${report.status}`}>{STATUS_LABELS[report.status]||report.status}</span></div><h2 id="agency-detail-heading" tabIndex={-1}>{report.title}</h2><span className="agency-draft">{cleanLabel(report.permanentLabel)}</span></header><details className="agency-description"><summary>Deskripsi dan fakta laporan</summary><p>{report.body}</p><dl><div><dt>Kecamatan / Kelurahan</dt><dd>{report.districtName}, {report.subdistrictName}</dd></div><div><dt>Patokan</dt><dd>{report.landmark}</dd></div><div><dt>Ukuran</dt><dd>{report.dimensionsCm}</dd></div><div><dt>Dukungan</dt><dd>{report.upvotes} warga</dd></div></dl></details>
      <section className="agency-section"><h3>Perbarui penanganan</h3><p className="agency-helper">Anda juga dapat membuka tautan akses laporan dari email instansi jika tersedia.</p><div className="agency-form-grid"><div className="agency-field"><label htmlFor="new-status">Status penanganan</label><select id="new-status" value={newStatus} onChange={(e) => setNewStatus(e.target.value as "DIPROSES" | "SELESAI")} disabled={disabled}><option value="DIPROSES">Diproses</option><option value="SELESAI">Selesai</option></select></div><div className="agency-field"><label htmlFor="planned-date">Tanggal pengerjaan / estimasi (opsional)</label><input id="planned-date" type="date" value={plannedDate} onChange={e=>setPlannedDate(e.target.value)} disabled={disabled}/></div></div><div className="agency-field agency-note-field"><label htmlFor="agency-note">Catatan penanganan (opsional)</label><textarea id="agency-note" value={note} onChange={e=>setNote(e.target.value)} rows={2} disabled={disabled}/></div></section>
      <section className="agency-section"><h3>Bukti perbaikan</h3><div className="agency-evidence"><figure><figcaption>Sebelum perbaikan</figcaption>{beforePhotos.length?beforePhotos.map(item=><a href={item.publicUrl} key={item.id} target="_blank" rel="noopener noreferrer"><img src={item.publicUrl} alt="Kondisi jalan sebelum perbaikan"/></a>):<p className="agency-photo-empty">Foto dari laporan warga belum tersedia.</p>}</figure><figure><figcaption>Sesudah perbaikan</figcaption>{evidence?<a href={evidence.publicUrl} target="_blank" rel="noopener noreferrer"><img src={evidence.publicUrl} alt="Bukti perbaikan yang tercatat pada laporan"/></a>:<p className="agency-photo-empty">Unggah foto untuk menandai laporan Selesai.</p>}<div className="agency-field"><label htmlFor="after-photo">Foto sesudah (JPG, PNG, WebP)</label><input id="after-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileUpload} disabled={disabled||!isLiveDb}/></div><p className="agency-helper" role="status">{uploading?"Mengunggah dan mencatat foto…":evidence?"Bukti foto tersedia pada laporan.":"Foto wajib untuk status Selesai."}</p></figure></div>{uploadError&&<p role="alert" className="agency-notice agency-error">{uploadError}</p>}{photoDistance!==null&&photoDistance>100&&<p className="agency-notice agency-warning" role="status">Lokasi EXIF foto berjarak {Math.round(photoDistance)} meter dari titik laporan. Periksa kesesuaiannya; peringatan tidak memblokir pengiriman.</p>}<div className="agency-save"><p>{newStatus==="SELESAI"?"Status Selesai memulai masa pemantauan Community Sign-Off. Minimal satu foto sesudah wajib tersedia.":"Status Diproses memperbarui perkembangan penanganan untuk warga."}</p><button type="button" onClick={handleUpdateStatus} disabled={disabled||(newStatus==="SELESAI"&&!evidence)} className="agency-button agency-primary"><CheckCircle2 size={16} aria-hidden="true"/>{submitting?"Menyimpan…":"Simpan status"}</button></div></section>
      <details className="agency-return"><summary>Kembalikan ke admin</summary><p>Gunakan jika laporan berada di luar kewenangan instansi Anda.</p><div className="agency-field"><label htmlFor="return-reason">Alasan pengembalian (wajib)</label><input id="return-reason" type="text" value={returnReason} onChange={(e) => setReturnReason(e.target.value)} disabled={disabled} placeholder="Contoh: ruas ini merupakan jalan nasional"/></div><button type="button" className="agency-button" onClick={handleReturnToAdmin} disabled={disabled}><CornerUpLeft size={16} aria-hidden="true"/>Kembalikan laporan</button></details>
      <details className="agency-demo"><summary>Pratinjau kondisi simulasi</summary><p>Kontrol berikut hanya mengubah contoh tampilan. Tidak dianggap sebagai bukti foto dan tidak mengubah metadata yang dikirim.</p><button type="button" className="agency-button" aria-pressed={afterPhotoUploaded} onClick={() => setAfterPhotoUploaded((v) => !v)}><Camera size={16} aria-hidden="true"/>{afterPhotoUploaded?"Contoh foto: tersedia":"Contoh foto: kosong"}</button><label className="agency-checkbox"><input type="checkbox" checked={exifWarningSim} onChange={(e) => setExifWarningSim(e.target.checked)}/>Simulasi selisih EXIF &gt;100 m</label>{exifWarningSim&&<p className="agency-notice agency-warning">Contoh: selisih 165 meter. Peringatan tidak memblokir pengiriman; angka ini tidak dikirim sebagai hasil pemeriksaan foto.</p>}</details>
    </>}</section></div>
  </div></main>;
}
