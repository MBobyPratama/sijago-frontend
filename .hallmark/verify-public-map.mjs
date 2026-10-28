import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(new URL('./tooling/package.json', import.meta.url));
const puppeteer = require('puppeteer-core');
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const page = await browser.newPage();
const results = [];
const check = (name, condition) => { results.push({ name, pass: Boolean(condition) }); if (!condition) throw new Error(name); };
try {
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto('http://localhost:3210', { waitUntil: 'networkidle0' });
  await page.waitForSelector('.pm-report');
  const initialCount = await page.$$eval('.pm-report', (els) => els.length);
  check('Verified public reports are rendered', initialCount > 0);
  check('Draft source labels remain visible', await page.$$eval('.pm-draft', (els) => els.every(el => el.textContent.includes('Draf'))));
  check('Primary report action keeps /lapor destination', await page.$eval('.pm-primary', el => el.getAttribute('href') === '/lapor'));
  await page.select('select[name="status"]', 'SELESAI');
  await page.waitForFunction(() => [...document.querySelectorAll('.pm-status')].every(el => el.textContent === 'Selesai'));
  check('Status filter updates the list and marker count', await page.$$eval('.pm-report', els => els.length) === await page.$$eval('.maplibregl-marker', els => els.length));
  await page.click('.pm-text-button');
  await page.waitForFunction((n) => document.querySelectorAll('.pm-report').length === n, {}, initialCount);
  await page.select('select[name="kecamatan"]', 'Bogor Utara');
  await page.waitForSelector('.pm-empty');
  check('Empty state is visible', await page.$eval('.pm-empty', el => el.textContent.includes('Belum ada laporan')));
  await page.click('.pm-empty button');
  await page.waitForFunction((n) => document.querySelectorAll('.pm-report').length === n, {}, initialCount);
  check('Reset restores district, category, and status', await page.$$eval('.pm-filters select', els => els.every(el => el.value === 'ALL')));
  await page.click('.pm-report-summary summary');
  check('Summary disclosure retains report text', await page.$eval('.pm-report-summary', el => el.open && el.querySelector('p').textContent.length > 20));
  await page.click('.pm-report-summary summary');
  const votes = await page.$eval('.pm-upvote span', el => Number(el.textContent));
  await page.click('.pm-upvote');
  await page.waitForFunction(() => document.querySelector('.pm-upvote').getAttribute('aria-pressed') === 'true');
  check('Support increases once', await page.$eval('.pm-upvote span', el => Number(el.textContent)) === votes + 1);
  await page.click('.pm-upvote');
  await page.waitForFunction(() => document.querySelector('.pm-upvote').getAttribute('aria-pressed') === 'false');
  check('Support can be cancelled', await page.$eval('.pm-upvote span', el => Number(el.textContent)) === votes);
  await page.click('.pm-show-map');
  await page.waitForSelector('.maplibregl-popup');
  check('List selection opens map popup', await page.$eval('.pm-show-map', el => el.getAttribute('aria-pressed') === 'true'));
  check('Popup detail link is retained', await page.$eval('.sijago-map-popup a', el => el.getAttribute('href').startsWith('/laporan/')));
  await page.click('.pm-map-reset');
  check('Map reset clears selected report', await page.$eval('.pm-show-map', el => el.getAttribute('aria-pressed') === 'false'));
  for (const width of [320, 375, 768, 1280, 1920]) {
    await page.setViewport({ width, height: 900 });
    check(`No horizontal overflow at ${width}px`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.waitForFunction(() => {
      const map = document.querySelector('.pm-map-canvas').getBoundingClientRect();
      return [...document.querySelectorAll('.maplibregl-marker')].every(el => {
        const r = el.getBoundingClientRect();
        return r.left >= map.left && r.right <= map.right && r.top >= map.top + 65 && r.bottom <= map.bottom - 55;
      });
    });
    check(`All report markers fit at ${width}px`, true);
    check(`Filters fit at ${width}px`, await page.$$eval('.pm-filters select', els => els.every(el => el.getBoundingClientRect().width > 130)));
  }
  await page.setViewport({ width: 375, height: 844 });
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion', value:'reduce'}]);
  await page.click('.pm-show-map');
  await page.waitForFunction(() => {
    const rect = document.querySelector('.pm-map-region').getBoundingClientRect();
    return rect.top >= -2 && rect.top < 50;
  });
  check('Phone map action brings map into view', true);
  check('Phone map receives focus', await page.$eval('.pm-map-region', el => el === document.activeElement));
  await page.goto('http://localhost:3210', {waitUntil:'networkidle0'});
  await page.waitForFunction(() => {
    const map = document.querySelector('.pm-map-canvas').getBoundingClientRect();
    return document.querySelectorAll('.maplibregl-marker').length > 0 && [...document.querySelectorAll('.maplibregl-marker')].every(el => {
      const r=el.getBoundingClientRect(); return r.left>=map.left && r.right<=map.right && r.top>=map.top + 65 && r.bottom<=map.bottom - 55;
    });
  });
  check('Fresh phone load fits every report marker', true);

  await page.addStyleTag({content:'nextjs-portal{display:none!important}'});
  await page.screenshot({path:'.hallmark/phone-verified.png',fullPage:true});
  await page.setViewport({width:1440,height:1000});
  await page.screenshot({path:'.hallmark/desktop-verified.png',fullPage:true});
  console.log(JSON.stringify(results, null, 2));
  writeFileSync('.hallmark/functional-results.json', JSON.stringify(results, null, 2));
} finally { await browser.close(); }
