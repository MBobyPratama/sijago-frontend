from pathlib import Path
import json
p=Path('src/app/theme-guide/page.tsx');s=p.read_text();s=s.replace('onClick={()=>copyToClipboard(', 'onClick={() => copyToClipboard(').replace('onClick={()=>setActiveTab(', 'onClick={() => setActiveTab(')
s=s.replace('css:', 'tailwind:').replace('t.css', 't.tailwind')
s=s.replace('<p>{scr.role}</p>', '<p>{scr.role}</p><p>{scr.features.replaceAll(" • ", ": ")}</p>')
s=s.replace('<h3 className="guide-subhead">Pola halaman warga</h3>', '''<h3 className="guide-subhead">Label dan ringkasan laporan</h3><div className="guide-preview"><span className="guide-badge guide-ai">[Draf Dibantu AI]</span><span className="guide-badge guide-civic">Selesai</span><span className="guide-badge">Lubang</span><span className="guide-badge">Tertutup Genangan Air (7)</span><span className="guide-badge">Rawan Kecelakaan Malam (4)</span></div><p className="guide-note">Contoh data: lubang berukuran 80 cm × 60 cm × 12 cm. Angka pada komponen ini hanya contoh dari laporan demo.</p><p className="guide-note">Community Sign-Off: laporan dibuka kembali jika minimal 3 suara dan lebih dari 50% menyatakan cepat rusak.</p><h3 className="guide-subhead">Pola halaman warga</h3>''')
p.write_text(s,encoding='utf-8')
p=Path('src/app/theme-guide/theme-guide.css');s=p.read_text();record=''
old=json.loads(Path('.hallmark/before.json').read_text())['pages']['http://localhost:3000/theme-guide']['headings']
for heading in old[:-1]:record+=f'/* Hallmark · reworded "{heading}" to "resident design reference" · user requests synchronizing outdated guide headings with current resident pages */\n'
s=s.replace('@import',record+'@import');s+='\n.theme-guide :is(button,code,.guide-status-name,.guide-status-list p,.guide-state-output) { font-variant-numeric: tabular-nums; }\n';p.write_text(s,encoding='utf-8')
