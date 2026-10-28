from pathlib import Path
p=Path('.hallmark/verify-moderasi.mjs');s=p.read_text(encoding='utf-8').replace("failAction='';await page.click('#decision-heading ~ .mod-primary');", "failAction='';await page.waitForFunction(()=>!document.querySelector('#decision-heading ~ .mod-primary').disabled);await page.click('#decision-heading ~ .mod-primary');");p.write_text(s,encoding='utf-8')
p=Path('src/app/admin/moderasi/moderasi.css');s=p.read_text(encoding='utf-8').replace('p { max-width: 75ch;', 'p { max-width: 60ch;');p.write_text(s,encoding='utf-8')
