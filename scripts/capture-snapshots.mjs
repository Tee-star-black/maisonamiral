import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.SNAPSHOT_BASE_URL || "http://127.0.0.1:3000";
const outputDir = path.resolve("snapshots");

const routes = [
  ["01-home", "/"],
  ["02-shop", "/shop"],
  ["03-product-emblem", "/product/emblem-tee"],
  ["04-product-automobile", "/product/automobile-tee"],
  ["05-product-guerrilla", "/product/guerrilla-tee"],
  ["06-bag", "/cart"],
  ["07-checkout", "/checkout"],
  ["08-subscribe", "/subscribe"],
  ["09-cookie-policy", "/cookies"],
  ["10-order-confirmed", "/order/confirmed?order=MA-SNAPSHOT"],
];

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1680, height: 1050 },
  deviceScaleFactor: 1,
});

await context.addInitScript(() => {
  window.localStorage.setItem(
    "maison-amiral-cart-v1",
    JSON.stringify([
      { slug: "emblem-tee", size: "M", quantity: 1 },
      { slug: "automobile-tee", size: "L", quantity: 1 },
    ]),
  );
});

const page = await context.newPage();

for (const [name, route] of routes) {
  const url = `${baseUrl}${route}`;
  console.log(`Capturing ${url}`);
  const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });

  if (!response || response.status() >= 400) {
    console.warn(`${route} returned ${response?.status() ?? "no response"}`);
  }

  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
  });

  await page.waitForTimeout(900);

  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < pageHeight; y += 850) {
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);

  await page.screenshot({
    path: path.join(outputDir, `${name}.png`),
    fullPage: true,
    animations: "disabled",
  });
}

await browser.close();
console.log(`Saved ${routes.length} snapshots to ${outputDir}`);
