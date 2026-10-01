/* Re-render the Eventbrite banner.
     node render.mjs
   Self-contained: the badge is read from this folder and inlined as a data
   URI, so nothing is fetched and the render does not depend on the site being
   reachable. Output is 2160x1080, the size Eventbrite recommends. */
import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const here  = dirname(fileURLToPath(import.meta.url));
const badge = 'data:image/webp;base64,'
            + readFileSync(join(here, 'SAFe-Badge_ART-Leader.webp')).toString('base64');
const html  = readFileSync(join(here, 'banner-launching-ai-native-arts.html'), 'utf8');

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
});
const page = await browser.newPage({ viewport: { width: 2160, height: 1080 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(src => { document.getElementById('badge').src = src; }, badge);
await page.waitForFunction(() => {
  const i = document.getElementById('badge');
  return i && i.complete && i.naturalWidth > 0;
});
await page.waitForTimeout(250);
await page.screenshot({ path: join(here, 'eventbrite-banner-launching-ai-native-arts.png') });
await browser.close();
console.log('rendered 2160x1080');
