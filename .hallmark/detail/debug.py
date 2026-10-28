from pathlib import Path
p=Path('.hallmark/verify-detail.mjs');s=p.read_text().replace("const requests=[];", "const requests=[]; page.on('pageerror',e=>console.log('PAGEERROR',e.message)); page.on('request',r=>{if(r.resourceType()==='fetch')console.log('FETCH',r.url());});");p.write_text(s)
