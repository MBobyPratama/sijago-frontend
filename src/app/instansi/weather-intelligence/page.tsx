"use client";

import React,{useEffect,useState,useCallback,useRef,useMemo}from"react";
import {apiFetch}from"@/lib/api";
import {browserApiBaseUrl}from"@/lib/api";
import {Download,RefreshCw,AlertTriangle,Info}from"lucide-react";
import {WeatherMap}from"./WeatherMap";
import "./weather.css";

interface DistrictWeatherStat {
  district: string;
  centerLat?: number;
  centerLng?: number;
  rainfallMm: number;
  verifiedReports: number;
  recurrentHotspots: number;
  isRedZone: boolean;
  recommendation: string;
}

interface WeatherIntelligenceResponse {
  lastSyncedAt: string | null;
  rainThresholdMm: number;
  kpis: {
    totalVerifiedReports: number;
    avgRainfallMm: number | null;
    activeRedZonesCount: number;
    activeRedZoneNames: string[];
    totalRecurrentHotspots: number;
  };
  earlyWarning: {
    active: boolean;
    affectedDistricts: string[];
    message: string;
  };
  districtStats: DistrictWeatherStat[];
}

const PERIOD_LABELS:Record<string,string>={"7_DAYS":"7 hari","30_DAYS":"30 hari","90_DAYS":"90 hari"};
const formatTime=(value:string|null)=>{if(!value)return "Waktu pembaruan tidak tersedia";const date=new Date(value);return Number.isNaN(date.getTime())?"Waktu pembaruan tidak tersedia":date.toLocaleString("id-ID",{timeZone:"Asia/Jakarta",dateStyle:"medium",timeStyle:"short"})+" WIB";};

export default function WeatherIntelligencePage(){
  const [selectedPeriod,setSelectedPeriod]=useState("30_DAYS");
  const [isLiveDb,setIsLiveDb]=useState(false);
  const [syncing,setSyncing]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [lastSyncedAt,setLastSyncedAt]=useState<string|null>(null);
  const [rainThresholdMm,setRainThresholdMm]=useState(50);
  const [districtStats,setDistrictStats]=useState<DistrictWeatherStat[]>([]);
  const [selectedDistrict,setSelectedDistrict]=useState("ALL");
  const [warningActive,setWarningActive]=useState(false);
  const [earlyWarningMsg,setEarlyWarningMsg]=useState("");
  const [kpis,setKpis]=useState<WeatherIntelligenceResponse["kpis"]>({totalVerifiedReports:0,avgRainfallMm:null,activeRedZonesCount:0,activeRedZoneNames:[],totalRecurrentHotspots:0});
  const requestVersion=useRef(0);const busy=useRef(false);
  const applySummary=(data:WeatherIntelligenceResponse)=>{setDistrictStats(data.districtStats);setSelectedDistrict(prev=>prev==="ALL"||data.districtStats.some(item=>item.district===prev)?prev:"ALL");setKpis(data.kpis);setRainThresholdMm(data.rainThresholdMm);setEarlyWarningMsg(data.earlyWarning.message);setWarningActive(data.earlyWarning.active);setLastSyncedAt(data.lastSyncedAt||null);setIsLiveDb(true);};
  const fetchWeatherIntelligence=useCallback(async()=>{const version=++requestVersion.current;setLoading(true);setError(null);try{const res=await apiFetch<WeatherIntelligenceResponse>("/weather/intelligence");if(version!==requestVersion.current)return;if(!res.success||!res.data||!Array.isArray(res.data.districtStats))throw new Error(res.error?.detail||"Ringkasan cuaca belum dapat dimuat.");applySummary(res.data);}catch(err){if(version===requestVersion.current)setError(err instanceof Error?err.message:"Koneksi ke server terputus.");}finally{if(version===requestVersion.current)setLoading(false);}},[]);
  useEffect(()=>{fetchWeatherIntelligence();return()=>{requestVersion.current++;};},[fetchWeatherIntelligence]);
  const handleManualSyncOpenMeteo=async()=>{if(busy.current||loading)return;busy.current=true;setSyncing(true);setError(null);const version=++requestVersion.current;try{const res=await apiFetch<WeatherIntelligenceResponse>("/weather/sync",{method:"POST"});if(version!==requestVersion.current)return;if(!res.success||!res.data)throw new Error(res.error?.detail||"Sinkronisasi belum berhasil.");applySummary(res.data);}catch(err){if(version===requestVersion.current)setError(err instanceof Error?err.message:"Sinkronisasi gagal. Snapshot terakhir tetap ditampilkan.");}finally{busy.current=false;setSyncing(false);}};
  const filteredStats=useMemo(()=>selectedDistrict==="ALL"?districtStats:districtStats.filter(item=>item.district===selectedDistrict),[districtStats,selectedDistrict]);
  const shownKpis=selectedDistrict==="ALL"?kpis:{totalVerifiedReports:filteredStats.reduce((n,item)=>n+item.verifiedReports,0),avgRainfallMm:filteredStats[0]?.rainfallMm||0,activeRedZonesCount:filteredStats.filter(item=>item.isRedZone).length,activeRedZoneNames:filteredStats.filter(item=>item.isRedZone).map(item=>item.district),totalRecurrentHotspots:filteredStats.reduce((n,item)=>n+item.recurrentHotspots,0)};
  const rainMax=Math.max(1,...filteredStats.map(item=>item.rainfallMm));const reportsMax=Math.max(1,...filteredStats.map(item=>item.verifiedReports));
  const handleExportCsv=()=>{if(isLiveDb)window.open(`${browserApiBaseUrl}/analytics/export.csv`,"_blank","noopener,noreferrer");};

  return <main className="weather-page"><div className="weather-container"><header className="weather-heading"><div><h1>Cuaca dan kondisi jalan</h1><p>Baca curah hujan, laporan kerusakan, dan area yang memerlukan perhatian.</p></div><div className="weather-actions"><button type="button" onClick={handleManualSyncOpenMeteo} disabled={syncing||loading} className="weather-button"><RefreshCw size={16} aria-hidden="true"/>{syncing?"Menyinkronkan…":"Sinkron Open-Meteo"}</button><button type="button" onClick={handleExportCsv} disabled={loading || !isLiveDb} className="weather-button"><Download size={16} aria-hidden="true"/>Ekspor CSV anonim</button></div></header>
    <div className="weather-source"><span role="status" className={isLiveDb&&!error?"weather-live":"weather-warning"}>{error&&isLiveDb?"Data usang, snapshot terakhir":isLiveDb?"Ringkasan server":"Belum ada data server"}</span><span>Pembaruan: {formatTime(lastSyncedAt)}</span></div>
    {error&&<div className="weather-notice weather-warning" role="alert"><AlertTriangle size={18} aria-hidden="true"/><p>{error} {isLiveDb?"Snapshot terakhir dipertahankan.":"Data cuaca belum tersedia."}</p></div>}
    {warningActive&&!loading&&<div className="weather-notice weather-warning" role="status"><AlertTriangle size={20} aria-hidden="true"/><div><h2>Peringatan dari ringkasan cuaca</h2><p>{earlyWarningMsg}</p></div></div>}
    <details className="weather-disclosure"><summary>Sumber, cakupan, dan batasan data</summary><p>Antarmuka ini menampilkan ringkasan yang dikembalikan server. Curah hujan berasal dari prakiraan harian Open-Meteo. Jumlah laporan berasal dari database, tanpa tambahan angka simulasi. Ini bukan peringatan resmi BMKG.</p><p>Periode acuan belum diterapkan oleh endpoint agregasi. CSV dari server berisi laporan anonim, bukan tabel curah hujan yang terfilter. Ekspor memerlukan koneksi ke server.</p></details>
    <section className="weather-filters" aria-label="Filter analisis"><div className="weather-field"><label htmlFor="weather-period">Periode acuan</label><select id="weather-period" value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}><option value="7_DAYS">7 hari terakhir</option><option value="30_DAYS">30 hari terakhir</option><option value="90_DAYS">90 hari (musim hujan)</option></select></div><div className="weather-field"><label htmlFor="weather-district">Wilayah</label><select id="weather-district" value={selectedDistrict} onChange={e=>setSelectedDistrict(e.target.value)}><option value="ALL">Seluruh kecamatan</option>{districtStats.map(item=><option value={item.district} key={item.district}>{item.district}</option>)}</select></div><p>Periode {PERIOD_LABELS[selectedPeriod]} merupakan acuan tampilan; angka masih memakai snapshot agregat API. Wilayah memfilter ringkasan, peta, dan rekomendasi.</p></section>
    {loading?<div className="weather-loading" role="status"><span/><span/><p>Memuat ringkasan cuaca dan kondisi jalan…</p></div>:<><section className="weather-kpis" aria-label="Ringkasan snapshot"><div><span>Laporan terverifikasi</span><strong>{shownKpis.totalVerifiedReports}</strong><p>Menurut ringkasan sumber</p></div><div><span>Rata-rata curah hujan</span><strong>{shownKpis.avgRainfallMm ?? "Belum tersedia"} <small>mm/hari</small></strong><p>Ambang hujan: {rainThresholdMm} mm/hari</p></div><div><span>Zona merah aktif</span><strong>{shownKpis.activeRedZonesCount} <small>kecamatan</small></strong><p>{shownKpis.activeRedZoneNames.join(", ")||"Tidak ada zona merah aktif"}</p></div><div><span>Titik kambuhan</span><strong>{shownKpis.totalRecurrentHotspots}</strong><p>Indikasi rusak kembali dalam 90 hari</p></div></section>
    {!filteredStats.length?<div className="weather-empty"><h2>Belum ada data wilayah</h2><p>Ringkasan kecamatan akan muncul setelah tersedia dari server.</p></div>:<><div className="weather-analysis"><section className="weather-map-section"><h2>Peta ringkasan kecamatan</h2><p>Lokasi menunjukkan pusat kecamatan, bukan koordinat setiap lubang jalan.</p><WeatherMap areas={filteredStats}/><div className="weather-legend"><span>Lingkaran biru: curah hujan</span><span>Lingkaran merah: zona merah</span><span>Ukuran titik: jumlah laporan</span></div><p className="weather-helper">Aturan menggabungkan ambang hujan {rainThresholdMm} mm/hari dengan laporan atau titik kambuhan. Klasifikasi mengikuti ringkasan server.</p></section>
    <section className="weather-comparison"><h2>Perbandingan per kecamatan</h2><p>Setiap ukuran memakai skala sendiri, bukan ukuran korelasi statistik.</p><div className="weather-chart-legend"><span>Hujan, maksimum {rainMax} mm/hari</span><span>Laporan, maksimum {reportsMax}</span></div>{filteredStats.map(item=><div className="weather-district-row" key={item.district}><div><h3>{item.district}</h3>{item.isRedZone&&<span className="weather-zone">Zona merah</span>}</div><label>{item.rainfallMm} mm/hari<meter min={0} max={rainMax} value={item.rainfallMm}>Curah hujan {item.rainfallMm} mm/hari</meter></label><label>{item.verifiedReports} laporan<meter className="weather-report-meter" min={0} max={reportsMax} value={item.verifiedReports}>{item.verifiedReports} laporan</meter></label></div>)}</section></div>
    <section className="weather-recommendations"><div className="weather-recommendation-heading"><div><h2>Titik kambuhan dan rekomendasi</h2><p>Rekomendasi berbasis aturan deterministik, bukan hasil generasi AI.</p></div><p className="weather-indicative"><Info size={16} aria-hidden="true"/>Indikatif — Bukan pengganti survei teknis lapangan (BRL-12)</p></div>{filteredStats.filter(item=>item.isRedZone).length?filteredStats.filter(item=>item.isRedZone).map(zone=><article key={zone.district}><div><h3>{zone.district}</h3><p>{zone.recurrentHotspots} titik kambuhan</p></div><p className="weather-trigger">Hujan {zone.rainfallMm} mm/hari; {zone.verifiedReports} laporan aktif.</p><p>{zone.recommendation}</p></article>):<p className="weather-empty-note">Tidak ada rekomendasi zona merah pada wilayah yang ditampilkan.</p>}</section></>}
    </>}
  </div></main>;
}
