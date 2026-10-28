from pathlib import Path
p=Path('src/app/instansi/laporan/page.tsx');s=p.read_text(encoding='utf-8').replace('setUploadError(null);setActionMessage(null);setExifWarningSim(false);','setUploadError(null);setExifWarningSim(false);');s=s.replace('  const shownReports=', '  useEffect(()=>{setActionMessage(null);},[selectedAgencyCode]);\n  const shownReports=');p.write_text(s,encoding='utf-8')
