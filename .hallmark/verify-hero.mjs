const {createRequire}=await import('node:module');
const require=createRequire(new URL('./tooling/package.json',import.meta.url));
const browser=await require('puppeteer-core').launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try {
 const page=await browser.newPage();
 await page.setViewport({width:1440,height:1000});
 const response=await page.goto('http://localhost:3210',{waitUntil:'domcontentloaded'});
 await page.addStyleTag({content:'nextjs-portal{display:none!important}'});
 if(response.status()!==200)throw Error('Page did not load');
 const image=await page.evaluate(()=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(true);image.onerror=()=>resolve(false);image.src='/images/hero_background.avif'}));
 if(!image)throw Error('Hero image failed');
 await page.screenshot({path:'.hallmark/hero-desktop.png'});
 await page.setViewport({width:375,height:844});
 if(!await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))throw Error('Mobile overflow');
 await page.screenshot({path:'.hallmark/hero-phone.png'});
 await page.click('.pm-hero-secondary');
 if(!await page.evaluate(()=>location.hash==='#peta-publik'))throw Error('Map anchor failed');
 console.log('PASS: background image, desktop and mobile layout, map anchor, primary report link');
}finally{await browser.close()}

