import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const HTML_FILE = path.join(__dirname, 'SpotSense-Demo.html');
const OUTPUT_MP4 = path.join(__dirname, 'SpotSense-Demo.mp4');

// Scene durations from the HTML (ms)
const SCENE_DURATIONS = [6000, 8000, 8000, 9000, 10000, 8000, 9000, 10000, 10000, 12000, 8000, 8000];
const TOTAL_MS = SCENE_DURATIONS.reduce((a, b) => a + b, 0); // 106000ms
const BUFFER_MS = 4000;

// Our capture runs at ~17fps. To get 30fps output, we slow the demo by this factor
// so we capture ~1.8x more frames for the same visual content.
// Output at 30fps then plays back at correct speed.
const TIME_SCALE = 1.8;

async function main() {
  const scaledTotal = TOTAL_MS * TIME_SCALE;
  const scaledBuffer = BUFFER_MS * TIME_SCALE;

  console.log(`HTML file: ${HTML_FILE}`);
  console.log(`Demo duration: ${TOTAL_MS / 1000}s -> ${scaledTotal / 1000}s (slowed ${TIME_SCALE}x)`);
  console.log(`Viewport: 1920x1080 @ 1x scale`);
  console.log(`Target output: 30fps, ~${(scaledTotal / 1000 / TIME_SCALE).toFixed(0)}s real-time`);
  console.log(`Capture rate: ~17fps -> 30fps output via time stretching\n`);

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
  const cdpSession = await context.newCDPSession(page);

  const htmlUrl = `file://${HTML_FILE}`;
  console.log(`Loading: ${htmlUrl}`);
  await page.goto(htmlUrl, { waitUntil: 'networkidle' });

  // Inject time-slowing CSS and JS BEFORE the demo's auto-play script takes effect
  await page.evaluate((timeScale) => {
    // 1. Slow all CSS animations
    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after {
        animation-duration: calc(var(--orig-dur, 1s) * ${timeScale}) !important;
        transition-duration: calc(var(--orig-trans, 1s) * ${timeScale}) !important;
      }
    `;
    document.head.appendChild(style);

    // Override individual animation/transition durations
    document.querySelectorAll('*').forEach(el => {
      const cs = getComputedStyle(el);
      const animDur = cs.animationDuration;
      const transDur = cs.transitionDuration;
      if (animDur && animDur !== '0s') {
        el.style.animationDuration = animDur.split(',').map(d => {
          const val = parseFloat(d);
          return (val * timeScale) + (d.includes('ms') ? 'ms' : 's');
        }).join(',');
      }
      if (transDur && transDur !== '0s') {
        el.style.transitionDuration = transDur.split(',').map(d => {
          const val = parseFloat(d);
          return (val * timeScale) + (d.includes('ms') ? 'ms' : 's');
        }).join(',');
      }
      // Also scale animation-delay and transition-delay
      const animDelay = cs.animationDelay;
      const transDelay = cs.transitionDelay;
      if (animDelay && animDelay !== '0s') {
        el.style.animationDelay = animDelay.split(',').map(d => {
          const val = parseFloat(d);
          return (val * timeScale) + (d.includes('ms') ? 'ms' : 's');
        }).join(',');
      }
      if (transDelay && transDelay !== '0s') {
        el.style.transitionDelay = transDelay.split(',').map(d => {
          const val = parseFloat(d);
          return (val * timeScale) + (d.includes('ms') ? 'ms' : 's');
        }).join(',');
      }
    });

    // 2. Scale scene data-duration attributes
    document.querySelectorAll('.scene[data-duration]').forEach(scene => {
      const dur = parseInt(scene.dataset.duration);
      scene.dataset.duration = String(Math.round(dur * timeScale));
    });
  }, TIME_SCALE);

  // Restart the demo from scene 0 with new timings
  await page.evaluate(() => {
    // Trigger restart via keyboard event
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyR' }));
  });

  await page.waitForTimeout(1000);

  const waitMs = scaledTotal + scaledBuffer;
  console.log(`Capture duration: ${(waitMs / 1000).toFixed(1)}s`);
  console.log('Starting CDP capture...\n');

  // Phase 1: Capture frames to memory
  const frames = [];
  let frameIndex = 0;
  const startTime = Date.now();
  let capturing = true;

  async function captureLoop() {
    while (capturing) {
      try {
        const { data } = await cdpSession.send('Page.captureScreenshot', {
          format: 'jpeg',
          quality: 90,
        });
        frames.push(Buffer.from(data, 'base64'));
        frameIndex++;

        if (frameIndex % 200 === 0) {
          const elapsed = (Date.now() - startTime) / 1000;
          const pct = Math.round((elapsed / (waitMs / 1000)) * 100);
          const fps = (frameIndex / elapsed).toFixed(1);
          const memMB = (frames.length * 80 / 1024).toFixed(0);
          console.log(`  Frame ${frameIndex} | ${elapsed.toFixed(0)}s / ${(waitMs / 1000).toFixed(0)}s (${pct}%) | ${fps} fps | ~${memMB}MB`);
        }
      } catch (err) {
        console.error(`  Frame ${frameIndex} error: ${err.message}`);
      }

      if (frameIndex % 10 === 0) {
        await new Promise(r => setTimeout(r, 1));
      }
    }
  }

  const capturePromise = captureLoop();
  await page.waitForTimeout(waitMs);
  capturing = false;
  await capturePromise;

  const captureElapsed = (Date.now() - startTime) / 1000;
  const actualFps = frameIndex / captureElapsed;
  console.log(`\nCapture complete: ${frameIndex} frames in ${captureElapsed.toFixed(1)}s`);
  console.log(`Actual capture FPS: ${actualFps.toFixed(2)}`);

  await context.close();
  await browser.close();
  console.log('Browser closed.');

  // Phase 2: Pipe frames to ffmpeg at 30fps output
  const OUTPUT_FPS = 30;
  console.log(`\nPiping ${frames.length} frames to ffmpeg at ${OUTPUT_FPS} fps...`);
  console.log(`Expected video duration: ${(frames.length / OUTPUT_FPS).toFixed(1)}s`);

  const ffmpeg = spawn('ffmpeg', [
    '-y',
    '-f', 'image2pipe',
    '-framerate', String(OUTPUT_FPS),
    '-i', 'pipe:0',
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '12',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-tune', 'film',
    OUTPUT_MP4,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });

  for (let i = 0; i < frames.length; i++) {
    const canWrite = ffmpeg.stdin.write(frames[i]);
    if (!canWrite) {
      await new Promise(resolve => ffmpeg.stdin.once('drain', resolve));
    }
    frames[i] = null; // free memory
    if (i % 500 === 0) {
      console.log(`  Encoded frame ${i}/${frames.length}`);
    }
  }

  ffmpeg.stdin.end();

  await new Promise((resolve, reject) => {
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log(`\nOutput saved to: ${OUTPUT_MP4}`);
        console.log(`Video: ${frames.length} frames at ${OUTPUT_FPS}fps = ${(frames.length / OUTPUT_FPS).toFixed(1)}s`);
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
  });

  console.log('Done!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
