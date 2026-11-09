import { chromium } from "playwright";
import { assertPublicHttpUrl } from "@aegistrust/core";
import { summarizeDom } from "./domHasher.js";
import { assessPage } from "../ai/gemini.js";

export async function captureAndAssess(input: string) {
  const url = await assertPublicHttpUrl(input);
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 800, height: 600 }, acceptDownloads: false, javaScriptEnabled: true });
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    await page.route("**/*", async route => {
      const request = route.request();
      const kind = request.resourceType();
      if (kind === "media" || kind === "font") return route.abort();
      try {
        const target = new URL(request.url());
        if (!/^https?:$/.test(target.protocol)) return route.abort();
        await assertPublicHttpUrl(target.href);
        return route.continue();
      } catch { return route.abort(); }
    });
    page.on("popup", popup => void popup.close());
    await page.goto(url.href, { waitUntil: "domcontentloaded", timeout: 8000 }).catch(() => undefined);
    await page.waitForTimeout(700);
    const html = await page.content().catch(() => "");
    const title = await page.title().catch(() => "");
    const dom = summarizeDom(html);
    const screenshot = await page.screenshot({ type: "jpeg", quality: 60, animations: "disabled", timeout: 4000 }).catch(() => undefined);
    const ai = await assessPage({ url: url.href, title, domSummary: dom.summary, credentialForm: dom.credentialForm, screenshotBase64: screenshot?.toString("base64") });
    return { domHash: dom.hash, ai, screenshotDataUrl: screenshot ? `data:image/jpeg;base64,${screenshot.toString("base64")}` : undefined };
  } finally { await browser.close(); }
}
