import {createRequire} from 'node:module';
const require=createRequire(new URL('./tooling/package.json',import.meta.url));
const browser=await require('puppeteer-core').launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try {
 const page=await browser.newPage();
 await page.setViewport({width:1440,height:1000});
 await page.goto('http://localhost:3210',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('.public-faq');
 await page.evaluate(()=>document.fonts.ready);
 await page.addStyleTag({content:'nextjs-portal{display:none!important}'});
 if(await page.$$eval('.public-faq details',els=>els.length)!==6)throw Error('Expected six questions');
 await page.focus('.public-faq summary');
 await page.keyboard.press('Enter');
 if(!await page.$eval('.public-faq details',el=>el.open))throw Error('Keyboard opening failed');
 await page.keyboard.press('Enter');
 if(await page.$eval('.public-faq details',el=>el.open))throw Error('Keyboard closing failed');
 for(const width of [320,375,768,1440,1920]){
  await page.setViewport({width,height:1000});
  if(!await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))throw Error(`Overflow at ${width}`);
  if(width===375||width===1440)await(await page.$('.public-faq')).screenshot({path:`.hallmark/faq-${width}.png`});
 }
 if(!await page.evaluate(()=>Boolean(document.querySelector('#faq').compareDocumentPosition(document.querySelector('footer'))&Node.DOCUMENT_POSITION_FOLLOWING)))throw Error('FAQ must precede footer');
 console.log('PASS: six FAQs, keyboard open/close, position before footer, responsive 320-1920px.');
}finally{await browser.close()}
