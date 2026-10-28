import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
const require=createRequire(new URL('./tooling/package.json',import.meta.url));
const browser=await require('puppeteer-core').launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const checks=[];
const check=(name,ok)=>{checks.push({name,pass:Boolean(ok)});if(!ok)throw Error(name)};
let facts={}, rejectApproval=false, failSubmit=false, idemKey='', uploads=0;
const jsonResponse=(request,data)=>request.respond({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(data)});
try {
 const page=await browser.newPage();
 await page.setViewport({width:1440,height:1000});
 await page.setRequestInterception(true);
 page.on('request',request=>{
  const path=new URL(request.url()).pathname;
  const body=(()=>{try{return JSON.parse(request.postData()||'{}')}catch{return {}}})();
  if(request.method()==='OPTIONS')return request.respond({status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'POST,PUT,GET,OPTIONS'}});
  if(path.endsWith('/geo/validate-point'))return jsonResponse(request,{success:true,data:{isInsideBogorCity:true,lat:-6.597147,lng:106.806039,districtName:'Bogor Tengah',subdistrictName:'Paledang',suggestedStreetName:'Jl. Ir. H. Juanda, Bogor Tengah',nearbyActiveReports:[]}});
  if(path.endsWith('/uploads/cloudinary-sign')){if(body.registerPhoto){uploads++;return jsonResponse(request,{success:true,data:{photo:{id:'test-photo'}}})}return jsonResponse(request,{success:true,data:{configured:false}})}
  if(path.endsWith('/reports')&&request.method()==='POST'){facts=body;return jsonResponse(request,{success:true,data:{reportId:'test-report',ticketCode:'SJG-TEST-001',factsHash:'hash-test-01'}})}
  if(path.endsWith('/reports/test-report/facts')){facts={...facts,...body};return jsonResponse(request,{success:true,data:{reportId:'test-report',factsHash:'hash-test-02',approvalReset:true}})}
  if(path.endsWith('/drafts/generate'))return jsonResponse(request,{success:true,data:{draftId:'test-draft',reportId:'test-report',factsHash:'hash-test-02',sourceType:body.forceFallback?'TEMPLATE':'AI',permanentLabel:body.forceFallback?'📄 [Draf Template]':'✨ [Draf Dibantu AI]',title:'Kerusakan jalan di Bogor Tengah',body:`Ukuran ${facts.sizeLengthCm} × ${facts.sizeWidthCm} × ${facts.sizeDepthCm} cm di ${facts.landmark}. ${facts.freeText}`,fallbackNotice:body.forceFallback?'Draf disusun menggunakan template baku.':null}});
  if(path.endsWith('/reports/test-report/approve'))return jsonResponse(request,rejectApproval?{success:false,error:{detail:'Fakta berubah. Silakan tinjau ulang.',code:'APPROVAL_HASH_MISMATCH'}}:{success:true});
  if(path.endsWith('/reports/test-report/submit')){idemKey=request.headers()['idempotency-key'];if(failSubmit)return request.abort('connectionfailed');return jsonResponse(request,{success:true,data:{reportId:'test-report',ticketCode:'SJG-TEST-001',status:'MENUNGGU_VERIFIKASI'}})}
  request.continue();
 });
 await page.goto('http://localhost:3001/lapor',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#damage-category');
 await page.evaluate(()=>document.fonts.ready);
 await page.addStyleTag({content:'nextjs-portal{display:none!important}'});
 check('Three upload controls remain',await page.$$eval('input[type=file]',els=>els.length===3));
 check('Each structured field has an accessible visible label',await page.$$eval('.report-field input,.report-field select,.report-field textarea',els=>els.every(el=>Boolean(document.querySelector(`label[for="${el.id}"]`)))));
 for(const width of [320,375,768,1440,1920]){
  await page.setViewport({width,height:1000});
  check(`No horizontal overflow at ${width}px`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  check(`Dimension inputs align at ${width}px`,await page.$$eval('.report-dimensions input',els=>Math.max(...els.map(el=>el.getBoundingClientRect().top))-Math.min(...els.map(el=>el.getBoundingClientRect().top))<2));
  check(`Selected size criteria visible at ${width}px`,await page.$eval('#damage-size-help',el=>el.textContent.includes('5 hingga 15 cm')&&el.scrollWidth<=el.clientWidth));
 }
 await page.setViewport({width:1440,height:1000});
 await page.screenshot({path:'.hallmark/lapor/desktop.png',fullPage:true});
 await page.$eval('.report-disclosure',el=>el.open=true);
 check('Duplicate report detail link preserved',await page.$eval('.report-disclosure a',el=>el.getAttribute('href')==='/laporan/SJG-2026-1042'));
 await page.$eval('.report-disclosure',el=>el.open=false);
 await page.$$eval('.report-demo-controls',els=>els.forEach(el=>el.open=true));
 await page.click('.report-demo-controls button.report-secondary');
 check('Outside-city simulation disables continue',await page.$eval('.report-action-bar .report-primary',el=>el.disabled));
 await page.click('.report-demo-controls button.report-secondary');
 check('Valid region enables continue',await page.$eval('.report-action-bar .report-primary',el=>!el.disabled));
 await page.click('.report-street-suggestion button');
 check('Suggested street copies into landmark',await page.$eval('#damage-landmark',el=>el.value.includes('Jl. Ir. H. Juanda')));
 await page.click('#damage-length'); await page.keyboard.down('Control'); await page.keyboard.press('a'); await page.keyboard.up('Control'); await page.keyboard.type('88');
 // Exercise the actual upload/compression handler with a tiny local PNG fixture.
 writeFileSync('.hallmark/lapor/upload-test.png',Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1cAAAAASUVORK5CYII=','base64'));
 await(await page.$('input[type=file]')).uploadFile('.hallmark/lapor/upload-test.png');
 await page.waitForSelector('.report-photo-preview');
 check('Upload registration and photo preview work',uploads===1);
 await page.click('.report-action-bar .report-primary');
 await page.waitForSelector('#draft-heading');
 check('Facts are saved before the draft stage',facts.photoIds.includes('test-photo')&&facts.landmark.includes('Juanda')&&facts.sizeLengthCm===88);
 await page.screenshot({path:'.hallmark/lapor/step2.png',fullPage:true});
 await page.$eval('.report-draft-stage details',el=>el.open=true);
 await page.click('.report-draft-stage input[type=checkbox]');
 await page.click('.report-draft-stage .report-primary');
 await page.waitForSelector('.report-approval');
 check('Template fallback label remains visible',await page.$eval('.report-draft-badge',el=>el.textContent.includes('Draf Template')));
 check('Submit requires approval',await page.$eval('.report-action-bar .report-primary',el=>el.disabled));
 await page.click('.report-approval input');
 check('Approval enables submit',await page.$eval('.report-action-bar .report-primary',el=>!el.disabled));
 await page.$eval('.report-review-facts details',el=>el.open=true);
 await page.click('.report-review-facts details button');
 check('Fact edits reset approval',await page.$eval('.report-approval input',el=>!el.checked&&el.disabled));
 check('Stale draft blocks submission',await page.$eval('.report-action-bar .report-primary',el=>el.disabled));
 await page.click('.report-alert-warning button');
 await page.waitForFunction(()=>!document.querySelector('.report-alert-warning'));
 check('Regenerated draft requires fresh approval',await page.$eval('.report-approval input',el=>!el.checked&&!el.disabled));
 await page.setViewport({width:375,height:844});
 await page.screenshot({path:'.hallmark/lapor/step3-phone.png',fullPage:true});
 check('Review comparison fits on phone',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.setViewport({width:1440,height:1000});
 await page.click('.report-approval input');
 rejectApproval=true;
 await page.click('.report-action-bar .report-primary');
 await page.waitForSelector('.report-alert-error');
 check('Server rejects stale approval visibly',await page.$eval('.report-alert-error',el=>el.textContent.includes('Fakta berubah')));
 check('Server rejection does not show success',!(await page.$('#success-heading')));
 rejectApproval=false;
 await page.click('.report-alert-warning button');
 await page.waitForFunction(()=>!document.querySelector('.report-alert-warning'));
 await page.click('.report-approval input');
 failSubmit=true;
 await page.click('.report-action-bar .report-primary');
 await page.waitForSelector('.report-alert-error');
 check('Network failure does not show a false success',!(await page.$('#success-heading')));
 failSubmit=false;
 await page.click('.report-action-bar .report-primary');
 await page.waitForSelector('#success-heading');
 check('Successful submit shows returned ticket',await page.$eval('.report-ticket strong',el=>el.textContent==='SJG-TEST-001'));
 check('Idempotency header remains attached',Boolean(idemKey?.startsWith('idem_test-report_')));
 check('Tracking and audit links preserved',await page.$$eval('.report-success-actions a',els=>els[0].getAttribute('href')==='/lacak?kode=SJG-TEST-001'&&els[1].getAttribute('href')==='/admin/audit'));
 await page.screenshot({path:'.hallmark/lapor/step4.png',fullPage:true});
 console.log(JSON.stringify(checks,null,2));
 writeFileSync('.hallmark/lapor/checks.json',JSON.stringify(checks,null,2));
}finally{await browser.close()}
