import {createRequire} from 'node:module';
const require=createRequire(new URL('./tooling/package.json',import.meta.url));
const browser=await require('puppeteer-core').launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try {
 const page=await browser.newPage();
 await page.setViewport({width:1440,height:1000});
 await page.goto('http://localhost:3210',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('.site-footer');
 await page.evaluate(()=>document.fonts.ready);
 await page.addStyleTag({content:'nextjs-portal{display:none!important}'});
 const results=[];
 for (const width of [320,375,768,1440,1920]) {
  await page.setViewport({width,height:1000});
  const result=await page.$eval('.site-footer',el=>{
   const heading=el.querySelector('h2');const r=heading.getBoundingClientRect();const style=getComputedStyle(el);
   return {fits:document.documentElement.scrollWidth<=innerWidth && heading.scrollWidth<=heading.clientWidth,background:style.backgroundColor,color:style.color,font:getComputedStyle(heading).fontFamily,links:[...el.querySelectorAll('a')].map(a=>a.getAttribute('href'))};
  });
  if(!result.fits || result.background!=='rgb(255, 255, 255)' || result.color!=='rgb(100, 116, 139)')throw Error(JSON.stringify({width,...result}));
  results.push({width,...result});
  if(width===375 || width===1440) await (await page.$('.site-footer')).screenshot({path:`.hallmark/footer-${width}.png`});
 }
 console.log(JSON.stringify(results,null,2));
}finally{await browser.close()}
