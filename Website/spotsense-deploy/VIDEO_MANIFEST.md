# Video Manifest — SpotSense Deploy Package

Videos are **excluded** from this deployment package to keep the zip size manageable.
Below is a complete inventory of every video reference in the source code, the original file paths, and the placeholder comments that replaced them in the deploy version.

> **All paths are relative to the `spotsense/` (or `spotsense-deploy/`) folder root.**

## Video Files

| # | Filename | Original Path | Size (orig) | Referenced In | Orig Line | Deploy Placeholder | Deploy Line |
|---|----------|---------------|-------------|---------------|-----------|--------------------|-------------|
| 1 | `hero-loop.mp4` | `assets/media/hero-loop.mp4` | 4.0 MB | `index.html` | L31 | `<!-- VIDEO: hero-loop.mp4 -->` | L31 |
| 2 | `ambient-overhead.mp4` | `assets/media/ambient-overhead.mp4` | 988 KB | `index.html` | L63 | `<!-- VIDEO: ambient-overhead.mp4 -->` | L62 |
| 3 | `usecase1-loop.mp4` | `assets/media/usecase1-loop.mp4` | 3.1 MB | `index.html` | L82 | `<!-- VIDEO: usecase1-loop.mp4 -->` | L80 |
| 4 | `usecase2-loop.mp4` | `assets/media/usecase2-loop.mp4` | 4.1 MB | `index.html` | L187 | `<!-- VIDEO: usecase2-loop.mp4 -->` | L184 |
| 5 | `ambient-skyline.mp4` | `assets/media/ambient-skyline.mp4` | 6.3 MB | `index.html` | L349 | `<!-- VIDEO: ambient-skyline.mp4 -->` | L345 |

## Context per Video

### 1. hero-loop.mp4
- **Section:** Hero (scroll-scrubbed playhead)
- **HTML:** `<video id="hero-video" src="assets/media/hero-loop.mp4" poster="assets/media/hero-still.jpg" muted playsinline preload="none" aria-hidden="true">`
- **JS dependency:** `main.js` L53 (`getElementById('hero-video')`), L122–166 (scrub fallback when JPEG frame sequence is unavailable)
- **Poster:** `assets/media/hero-still.jpg` (included in deploy)

### 2. ambient-overhead.mp4
- **Section:** Story — rain/overhead ambient loop
- **HTML:** `<video src="assets/media/ambient-overhead.mp4" poster="assets/media/texture-rain.jpg" muted playsinline loop preload="metadata" data-loop>`
- **JS dependency:** `main.js` L36 (`querySelectorAll('video[data-loop]')`) — IntersectionObserver auto-plays
- **Poster:** `assets/media/texture-rain.jpg` (included in deploy)

### 3. usecase1-loop.mp4
- **Section:** Use Case 1 — top-down drone feed of parking bay
- **HTML:** `<video src="assets/media/usecase1-loop.mp4" poster="assets/media/topdown-still.jpg" muted playsinline loop preload="metadata" data-loop>`
- **JS dependency:** `main.js` L36 (IntersectionObserver auto-play)
- **Poster:** `assets/media/topdown-still.jpg` (included in deploy)

### 4. usecase2-loop.mp4
- **Section:** Use Case 2 — driver POV background behind CarPlay screen
- **HTML:** `<video class="uc2__bg" src="assets/media/usecase2-loop.mp4" poster="assets/media/driver-pov.jpg" muted playsinline loop preload="metadata" data-loop aria-hidden="true">`
- **JS dependency:** `main.js` L36 (IntersectionObserver auto-play)
- **Poster:** `assets/media/driver-pov.jpg` (included in deploy)

### 5. ambient-skyline.mp4
- **Section:** Impact — projections strip background
- **HTML:** `<video class="impact__bg" src="assets/media/ambient-skyline.mp4" poster="assets/media/skyline-still.jpg" muted playsinline loop preload="metadata" data-loop aria-hidden="true">`
- **JS dependency:** `main.js` L36 (IntersectionObserver auto-play)
- **Poster:** `assets/media/skyline-still.jpg` (included in deploy)

## Restoring Videos

To restore the site to full functionality, copy each `.mp4` file into `assets/media/` inside the deploy folder, then replace each `<!-- VIDEO: *.mp4 -->` comment with the original `<video>` tag from the source `spotsense/index.html`.

## Total Video Size (excluded)

| Video | Size |
|-------|------|
| hero-loop.mp4 | 4.0 MB |
| ambient-overhead.mp4 | 988 KB |
| usecase1-loop.mp4 | 3.1 MB |
| usecase2-loop.mp4 | 4.1 MB |
| ambient-skyline.mp4 | 6.3 MB |
| **Total** | **~18.5 MB** |
