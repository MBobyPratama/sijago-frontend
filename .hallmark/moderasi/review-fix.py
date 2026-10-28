from pathlib import Path
p=Path('src/app/admin/moderasi/page.tsx');s=p.read_text(encoding='utf-8').replace('    setLoading(true);','    if (!busyRef.current) setLoading(true);')
s=s.replace('{isLiveDb?"Terhubung ke server":"Data contoh"}', '{queueError && isLiveDb ? "Data terakhir, koneksi gagal" : isLiveDb?"Terhubung ke server":"Data contoh"}')
s=s.replace('className={isLiveDb?"mod-source-live":"mod-source-demo"}', 'className={isLiveDb && !queueError?"mod-source-live":"mod-source-demo"}')
s=s.replace('onClick={() => setSelectedId(rep.id)}','''onClick={() => { setSelectedId(rep.id); if (window.matchMedia("(max-width: 760px)").matches) requestAnimationFrame(() => { const heading = document.getElementById("inspection-heading"); heading?.focus({preventScroll:true}); heading?.scrollIntoView({block:"start",behavior:"instant"}); }); }}''')
s=s.replace('<header className="mod-detail-heading"><div', '<header className="mod-detail-heading"><a href="#queue-heading" className="mod-back-queue">Kembali ke antrean</a><div')
s=s.replace('<h2>{selectedReport.title}</h2>', '<h2 id="inspection-heading" tabIndex={-1}>{selectedReport.title}</h2>')
s=s.replace('<section className="mod-section" aria-labelledby="facts-heading"><h3 id="facts-heading">Fakta laporan dan draf</h3>', '<details className="mod-section mod-facts-disclosure"><summary>Fakta laporan dan draf</summary>')
s=s.replace('</dd></div></dl></section>\n              <section className="mod-section" aria-labelledby="evidence-heading">','</dd></div></dl></details>\n              <section className="mod-section" aria-labelledby="evidence-heading">',1)
# put verify next to decision heading, keeping handler unchanged
verify='<button type="button" onClick={handleVerifyReport} disabled={disabled} className="mod-button mod-primary"><CheckCircle2 size={17} aria-hidden="true" />{busy==="verify"?"Memverifikasi…":"Verifikasi laporan"}</button>'
s=s.replace(verify,'');s=s.replace('<h3 id="decision-heading">Catatan dan keputusan</h3>', '<div className="mod-decision-heading"><h3 id="decision-heading">Catatan dan keputusan</h3>'+verify+'</div>')
s=s.replace('rows={3}', 'rows={2}')
s=s.replace('di <code>report_audit_logs</code>.</p>', 'di <code>report_audit_logs</code>. Jika server memakai mode simulasi, email asli tidak dikirim; hasil pengiriman akan ditandai setelah konfirmasi.</p>')
p.write_text(s,encoding='utf-8')
p=Path('src/app/admin/moderasi/moderasi.css');s=p.read_text(encoding='utf-8');s+='''
/* Finish review: denser evidence workbench, explicit stale state, mobile focus and truthful delivery preview. */
.mod-report-row { padding: var(--space-md); gap: var(--space-2xs); }
.mod-report-row strong { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: clip; }
.mod-queue-list { max-height: 520px; }
.mod-inspection { padding: var(--space-lg); }
.mod-detail-heading { padding-bottom: var(--space-md); }
.mod-detail-heading h2 { font-size: var(--text-lg); }
.mod-detail-meta { margin-bottom: var(--space-xs); }
.mod-section { padding-block: var(--space-md); }
.mod-section > h3 { margin-bottom: var(--space-sm); }
.mod-facts-disclosure summary { cursor: pointer; min-height: 44px; align-content: center; font-size: var(--text-sm); font-weight: 600; }
.mod-facts-disclosure > p { margin-top: var(--space-md); font-size: var(--text-sm); }
.mod-decision-heading { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-sm); margin-bottom: var(--space-md); }
.mod-secondary-actions { margin-top: var(--space-md); padding-top: var(--space-md); }
.mod-back-queue { display: none; }
@media (max-width: 760px) { .mod-back-queue { display: inline-flex; align-items: center; min-height: 44px; color: var(--color-accent); text-decoration: underline; font-size: var(--text-sm); } .mod-queue-list { max-height: 360px; } #inspection-heading { scroll-margin-top: var(--space-lg); } }
''';s=s.replace('@import','/* Hallmark · dropped onClick={() => setSelectedId(rep.id)} · same report selection now also focuses and scrolls to inspection on mobile */\n@import',1)
s=s.replace('/* Hallmark · pre-emit','/* Hallmark · finish-review: subagent · 4 findings · compact evidence/actions, mobile inspection focus, stale provenance, simulated-delivery disclosure implemented */\n/* Hallmark · pre-emit',1);p.write_text(s,encoding='utf-8')
p=Path('.hallmark/verify-moderasi.mjs');s=p.read_text(encoding='utf-8');s=s.replace("await page.click(","await page.locator(");# locator requires close selector then .click adjust all
import re
s=re.sub(r"await page\.locator\((('(?:[^'\\]|\\.)*')|(?:\"[^\"]*\"))\);",r"await page.locator(\1).click();",s)
s=s.replace("#decision-heading ~ .mod-primary", ".mod-decision-heading .mod-primary")
s=s.replace("document.querySelector('.mod-source-live'));queueMode='offline'", "document.querySelector('.mod-source-demo'));queueMode='offline'")
s=s.replace("!!await page.$('.mod-source-live'));queueMode='offline'", "await page.$eval('.mod-context',e=>e.textContent.includes('Data terakhir')));queueMode='offline'")
p.write_text(s,encoding='utf-8')
