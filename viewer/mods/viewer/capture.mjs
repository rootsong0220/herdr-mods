// Full-page screenshot of a URL with headless Chrome over the DevTools protocol, cut into tiles:
// one huge PNG can exceed the GPU texture limit (~16k px). Prints {title, width, tiles:[{file,height}]}.
// usage: node capture.mjs <url or file path> <outDir> <cssWidth> [<pixel scale>]
// Browser: $VIEWER_CHROME, else Chrome, Chromium or Edge from PATH or their usual install folders.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { pathToFileURL } from "node:url";

const [target, outDir, widthArg, scaleArg] = process.argv.slice(2);
const url = /^(https?|file):/i.test(target) ? target : pathToFileURL(target).href;
const WIDTH = Math.max(320, Math.min(2400, Number(widthArg) || 1000));
// Pixels per CSS px; HiDPI screens need 2 or the shot is drawn blurred at twice its size.
const SCALE = Math.max(1, Math.min(3, Number(scaleArg) || 1));
// A tile's pixel height stays under the ~16k texture limit.
const TILE = Math.floor(Math.min(4000, 16000 / SCALE));
const MAX_HEIGHT = 60000;

function findBrowser(env = process.env, platform = process.platform) {
  if (env.VIEWER_CHROME) return env.VIEWER_CHROME;
  const ext = platform === "win32" ? ".exe" : "";
  const names = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "microsoft-edge", "chrome", "msedge"];
  for (const dir of (env.PATH ?? "").split(delimiter).filter(Boolean)) {
    for (const n of names) if (existsSync(join(dir, n + ext))) return join(dir, n + ext);
  }
  const installed = platform === "darwin"
    ? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium",
       "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"]
    : platform === "win32"
      ? [env.ProgramFiles, env["ProgramFiles(x86)"], env.LOCALAPPDATA].filter(Boolean).flatMap((root) => [
          join(root, "Google", "Chrome", "Application", "chrome.exe"), join(root, "Microsoft", "Edge", "Application", "msedge.exe")])
      : [];
  return installed.find((p) => existsSync(p)) ?? null;
}

const CHROME = findBrowser();
if (!CHROME) { console.error("No Chrome, Chromium or Edge found (set VIEWER_CHROME)"); process.exit(1); }

const profile = mkdtempSync(join(tmpdir(), "herdr-viewer-"));
const chrome = spawn(CHROME, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
const exited = new Promise((r) => chrome.once("exit", r));
let closeBrowser = null;
const done = async (code) => {
  await Promise.race([closeBrowser?.().catch(() => null), sleep(1000)]);
  chrome.kill("SIGKILL");
  await Promise.race([exited, sleep(2000)]);
  try { rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); } catch {}
  process.exit(code);
};
setTimeout(() => { console.error("timeout"); done(2); }, 45000);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function wsUrl() {
  for (let i = 0; i < 100; i++) {
    try { const [port] = readFileSync(join(profile, "DevToolsActivePort"), "utf8").split("\n"); if (port) return `http://127.0.0.1:${port}`; } catch {}
    await sleep(100);
  }
  throw new Error("chrome did not start");
}

try {
  const base = await wsUrl();
  const page = (await (await fetch(`${base}/json/list`)).json()).find((t) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const waiting = new Map(); const events = [];
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id) waiting.get(d.id)?.(d); else events.push(d.method); };
  const send = (method, params = {}) => new Promise((r, j) => { const n = ++id; waiting.set(n, (d) => d.error ? j(new Error(d.error.message)) : r(d.result)); ws.send(JSON.stringify({ id: n, method, params })); });
  // A clean close lets Chrome end its helper processes too (on Windows killing the main one may not).
  closeBrowser = async () => { const v = await (await fetch(`${base}/json/version`)).json(); const b = new WebSocket(v.webSocketDebuggerUrl);
    await new Promise((r, j) => { b.onopen = r; b.onerror = j; }); b.send(JSON.stringify({ id: 1, method: "Browser.close" })); await sleep(300); };
  const evalJs = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result.value;

  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: WIDTH, height: 900, deviceScaleFactor: SCALE, mobile: false });
  const nav = await send("Page.navigate", { url });
  if (nav.errorText) throw new Error(nav.errorText);
  for (let i = 0; i < 150 && !events.includes("Page.loadEventFired"); i++) await sleep(100);
  // Scroll through once so lazy-loaded content is there before the shot.
  await evalJs(`(async () => { const h = () => document.documentElement.scrollHeight;
    for (let y = 0; y < Math.min(h(), ${MAX_HEIGHT}); y += 800) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
    scrollTo(0, 0); await new Promise(r => setTimeout(r, 300)); })()`);
  const title = await evalJs("document.title");
  const { cssContentSize } = await send("Page.getLayoutMetrics");
  const height = Math.min(Math.ceil(cssContentSize.height), MAX_HEIGHT);
  mkdirSync(outDir, { recursive: true });
  const tiles = [];
  for (let y = 0, i = 0; y < height; y += TILE, i++) {
    const h = Math.min(TILE, height - y);
    const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y, width: WIDTH, height: h, scale: 1 } });
    const file = `tile-${i}.png`;
    writeFileSync(join(outDir, file), Buffer.from(shot.data, "base64"));
    tiles.push({ file, height: h });
  }
  console.log(JSON.stringify({ title, width: WIDTH, height, truncated: cssContentSize.height > MAX_HEIGHT, tiles }));
  ws.close();
  await done(0);
} catch (e) {
  console.error(String(e?.message ?? e));
  await done(1);
}
