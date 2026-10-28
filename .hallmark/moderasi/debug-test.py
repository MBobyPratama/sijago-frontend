from pathlib import Path
p=Path('.hallmark/verify-moderasi.mjs');s=p.read_text(encoding='utf-8');print(s.splitlines()[4][1750:2050]);s=s.replace('checks.push({name,pass:!!ok});','checks.push({name,pass:!!ok});console.log(name,!!ok);');s=s.replace('}finally{await browser.close();}', '}catch(e){console.log(checks);throw e;}finally{await browser.close();}');p.write_text(s,encoding='utf-8')
