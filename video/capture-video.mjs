import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const HTML_FILE = path.join(__dirname, 'SpotSense-Demo.html');
const OUTPUT_DIR = path.join(__dirname, 'recordings');
const RAW_VIDEO = path.join(OUTPUT_DIR, 'raw-recording.webm');
const FINAL_MP4 = path.join(__dirname, 'SpotSense-Demo.mp4');

// Scene durations from the HTML (ms)
const SCENE_DURATIONS = [6000, 8000, 8000, 9000, 10000, 8000, 9000, 10000, 10000, 12000, 8000, 8000];
const TOTAL_MS = SCENE_DURATIONS.reduce((a, b) => a + b, 0); // 106000ms = ~106s
const BUFFER_MS = 3000; // extra buffer after last scene

async function main() {
  // Ensure output dir exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`HTML file: ${HTML_FILE}`);
  console.log(`Total scene duration: ${TOTAL_MS / 1000}s (+ ${BUFFER_MS / 1000}s buffer)`);
  console.log(`Viewport: 1920x1080 (landscape)`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-gpu', '--no-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 1920, height: 1080 },
    },
    // Disable any default browser chrome
    bypassCSP: true,
  });

  const page = await context.newPage();

  // Load the HTML file
  const htmlUrl = `file://${HTML_FILE}`;
  console.log(`Loading: ${htmlUrl}`);
  await page.goto(htmlUrl, { waitUntil: 'networkidle' });

  // Wait a moment for fonts to load
  await page.waitForTimeout(2000);

  // The demo auto-plays on load. We just need to wait for all scenes to complete.
  const waitMs = TOTAL_MS + BUFFER_MS;
  console.log(`Recording for ${(waitMs / 1000).toFixed(1)}s...`);

  // Wait in 10s chunks to show progress
  const CHUNK = 10000;
  let elapsed = 0;
  while (elapsed < waitMs) {
    const remaining = Math.min(CHUNK, waitMs - elapsed);
    await page.waitForTimeout(remaining);
    elapsed += remaining;
    const pct = Math.round((elapsed / waitMs) * 100);
    console.log(`  Progress: ${pct}% (${(elapsed / 1000).toFixed(0)}s / ${(waitMs / 1000).toFixed(0)}s)`);
  }

  console.log('Closing browser to save video...');

  // Close context to finalize the video file
  const videoObj = await page.video();
  await context.close();

  if (videoObj) {
    const videoPath = await videoObj.path();
    console.log(`Raw video saved to: ${videoPath}`);

    // Rename/move to our desired path
    if (videoPath !== RAW_VIDEO) {
      fs.copyFileSync(videoPath, RAW_VIDEO);
      console.log(`Copied to: ${RAW_VIDEO}`);
    }
  }

  await browser.close();
  console.log('Done! Raw recording saved.');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
