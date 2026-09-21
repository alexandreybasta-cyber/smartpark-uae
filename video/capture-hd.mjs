import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const HTML_FILE = path.join(__dirname, 'SpotSense-Demo.html');
const FRAMES_DIR = '/tmp/spotsense-frames';
const OUTPUT_MP4 = path.join(__dirname, 'SpotSense-Demo-HD.mp4');

// Scene durations from the HTML (ms)
const SCENE_DURATIONS = [6000, 8000, 8000, 9000, 10000, 8000, 9000, 10000, 10000, 12000, 8000, 8000];
const TOTAL_MS = SCENE_DURATIONS.reduce((a, b) => a + b, 0); // 106000ms = ~106s
const BUFFER_MS = 3000; // extra buffer after last scene
const FPS = 30;
const FRAME_INTERVAL_MS = 1000 / FPS; // ~33.33ms

async function main() {
  // Clean and create frames directory
  if (fs.existsSync(FRAMES_DIR)) {
    fs.rmSync(FRAMES_DIR, { recursive: true });
  }
  fs.mkdirSync(FRAMES_DIR, { recursive: true });

  console.log(`HTML file: ${HTML_FILE}`);
  console.log(`Total scene duration: ${TOTAL_MS / 1000}s (+ ${BUFFER_MS / 1000}s buffer)`);
  console.log(`Viewport: 1920x1080 (native capture)`);
  console.log(`Capture rate: ${FPS} fps`);
  console.log(`Frames dir: ${FRAMES_DIR}`);

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-gpu',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    bypassCSP: true,
  });

  const page = await context.newPage();

  // Load the HTML file
  const htmlUrl = `file://${HTML_FILE}`;
  console.log(`Loading: ${htmlUrl}`);
  await page.goto(htmlUrl, { waitUntil: 'networkidle' });

  // Wait for fonts to load
  await page.waitForTimeout(2000);

  const waitMs = TOTAL_MS + BUFFER_MS;
  const expectedFrames = Math.ceil((waitMs / 1000) * FPS);
  console.log(`Expected ~${expectedFrames} frames over ${(waitMs / 1000).toFixed(1)}s`);
  console.log('Starting capture...');

  // Screenshot capture loop - capture as fast as possible, track timestamps
  let frameIndex = 0;
  const startTime = Date.now();
  let capturing = true;

  async function captureFrame() {
    if (!capturing) return;

    const frameNum = String(frameIndex + 1).padStart(5, '0');
    const framePath = path.join(FRAMES_DIR, `frame_${frameNum}.jpg`);

    try {
      await page.screenshot({ path: framePath, type: 'jpeg', quality: 95 });
      frameIndex++;

      // Progress logging every 150 frames (~5s worth)
      if (frameIndex % 150 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const pct = Math.round((elapsed / (waitMs / 1000)) * 100);
        const fps = (frameIndex / elapsed).toFixed(1);
        console.log(`  Frame ${frameIndex} | ${elapsed.toFixed(0)}s / ${(waitMs / 1000).toFixed(0)}s (${pct}%) | ${fps} fps`);
      }
    } catch (err) {
      console.error(`  Frame ${frameIndex} error: ${err.message}`);
    }

    if (capturing) {
      // Minimal delay to yield to event loop
      setImmediate(captureFrame);
    }
  }

  // Start capturing
  captureFrame();

  // Wait for all scenes to complete
  await page.waitForTimeout(waitMs);

  // Stop capture
  capturing = false;

  // Small delay to let last in-flight screenshot finish
  await page.waitForTimeout(500);

  console.log(`\nCapture complete: ${frameIndex} frames captured`);
  const captureElapsed = (Date.now() - startTime) / 1000;
  const actualFps = frameIndex / captureElapsed;
  console.log(`Elapsed: ${captureElapsed.toFixed(1)}s, Actual FPS: ${actualFps.toFixed(2)}`);

  // Close browser
  await context.close();
  await browser.close();
  console.log('Browser closed.');

  // Stitch with ffmpeg using actual capture framerate
  const outputFps = Math.round(actualFps);
  console.log(`\nStitching frames into HD MP4 at ${outputFps} fps...`);
  const ffmpegCmd = [
    'ffmpeg', '-y',
    '-framerate', String(outputFps),
    '-i', path.join(FRAMES_DIR, 'frame_%05d.jpg'),
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '15',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    `"${OUTPUT_MP4}"`,
  ].join(' ');

  console.log(`Running: ${ffmpegCmd}`);
  try {
    execSync(ffmpegCmd, { stdio: 'inherit', timeout: 300000 });
    console.log(`\nOutput saved to: ${OUTPUT_MP4}`);
  } catch (err) {
    console.error('ffmpeg failed:', err.message);
    process.exit(1);
  }

  // Clean up frames
  console.log('Cleaning up frames...');
  fs.rmSync(FRAMES_DIR, { recursive: true });
  console.log('Done!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
