from pathlib import Path
p=Path('src/app/admin/moderasi/page.tsx');s=p.read_text(encoding='utf-8');needle='  const notify =';pos=s.index(needle);s=s[:pos]+'''  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const list = document.querySelector<HTMLElement>(".mod-queue-list");
      const row = list?.querySelector<HTMLElement>("[aria-pressed=true]");
      if (list && row) list.scrollTop = row.offsetTop - list.offsetTop;
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedId, filteredReports]);
'''+s[pos:];p.write_text(s,encoding='utf-8')
p=Path('.hallmark/verify-moderasi.mjs');s=p.read_text(encoding='utf-8');a="await pause(1000);console.log('DEBUG',mutations,rows,await page.$eval('.mod-inspection',e=>e.textContent));";s=s.replace(a,'');s=s.replace("writeFileSync('.hallmark/moderasi/checks.json'", "await page.setViewport({width:375,height:900});await page.locator('.mod-report-row').click();await pause(200);check('Mobile selection focuses inspection',await page.$eval('#inspection-heading',e=>document.activeElement===e));check('Mobile selection scrolls inspection into view',await page.$eval('#inspection-heading',e=>e.getBoundingClientRect().top>=0&&e.getBoundingClientRect().top<innerHeight));check('Mobile return to queue available',await page.$eval('.mod-back-queue',e=>e.getBoundingClientRect().height>=44));writeFileSync('.hallmark/moderasi/checks.json'")
p.write_text(s,encoding='utf-8')
