import { spawn } from "node:child_process";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME_CANDIDATES = [
  process.env.CHROME_BIN,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "google-chrome",
  "chromium",
  "chromium-browser",
].filter((x): x is string => Boolean(x));

function runChrome(bin: string, args: string[], timeoutMs = 60000): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const settle = (fn: () => void) => {
      if (!settled) {
        settled = true;
        fn();
      }
    };
    const child = spawn(bin, args, { stdio: ["ignore", "ignore", "pipe"], detached: true });
    let err = "";
    child.stderr?.on("data", (d) => {
      if (err.length < 4000) err += d;
    });

    let killTimer: NodeJS.Timeout | undefined;
    const timer = setTimeout(() => {
      try {
        if (child.pid) process.kill(-child.pid, "SIGTERM"); // graceful first
      } catch {
        /* gone */
      }
      killTimer = setTimeout(() => {
        try {
          if (child.pid) process.kill(-child.pid, "SIGKILL");
        } catch {
          /* gone */
        }
      }, 3000);
      settle(() => reject(new Error("chrome timed out")));
    }, timeoutMs);

    child.on("error", (e) => {
      clearTimeout(timer);
      settle(() => reject(e));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (killTimer) clearTimeout(killTimer);
      settle(() => (code === 0 ? resolve() : reject(new Error(`chrome exited ${code}: ${err.trim().slice(-400)}`))));
    });
  });
}

// Renders HTML to a PDF Buffer using a local headless Chrome/Chromium.
export async function renderPdf(html: string): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), "zdf-pdf-"));
  try {
    const htmlPath = join(dir, "offer.html");
    const pdfPath = join(dir, "offer.pdf");
    await writeFile(htmlPath, html);
    const args = ["--headless", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${pdfPath}`, htmlPath];

    let lastErr: unknown;
    for (const bin of CHROME_CANDIDATES) {
      try {
        await runChrome(bin, args);
        return await readFile(pdfPath);
      } catch (e) {
        lastErr = e;
      }
    }
    throw new Error(
      `No working Chrome/Chromium found for PDF rendering. Set CHROME_BIN to your browser path. Last error: ${
        lastErr instanceof Error ? lastErr.message : String(lastErr)
      }`,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
