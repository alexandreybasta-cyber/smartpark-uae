/* ============================================================
   SpotSense — scroll choreography
   Lenis smooth scroll + GSAP ScrollTrigger.
   Hero: hero-loop.mp4 playhead scrubbed against scroll (Apple
   style) and composited on canvas with grade overlays. Falls
   back to hero-still.jpg if the video can't decode; reduced
   motion gets the still, no pins, no scrub.
============================================================ */
(function () {
  'use strict';

  gsap.registerPlugin(ScrollTrigger);

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Lenis smooth scroll ---------- */
  var lenis = null;
  if (!reduced) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length > 1 && document.querySelector(id)) {
          e.preventDefault();
          lenis.scrollTo(id, { offset: 0, duration: 1.4 });
        }
      });
    });
  }

  /* ---------- ambient loops: play only while on screen ---------- */
  var loops = document.querySelectorAll('video[data-loop]');
  if (!reduced && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) { v.play().catch(function () {}); }
        else { v.pause(); }
      });
    }, { rootMargin: '120px' });
    loops.forEach(function (v) { io.observe(v); });
  }

  /* ============================================================
     HERO — video playhead scrub on canvas
  ============================================================ */
  var canvas = document.getElementById('hero-canvas');
  var ctx = canvas.getContext('2d');
  var video = document.getElementById('hero-video');
  var heroImg = new Image();
  var imgReady = false;
  var videoReady = false;
  var frames = null;        // decoded JPEG sequence — the smooth path
  var framesLoaded = 0;
  var lastProgress = 0;
  var smoothT = 0;          // lerped playhead position 0..1

  function framesReady() { return frames && framesLoaded === frames.length; }

  function sizeCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
  }

  function coverRect(srcW, srcH, cw, ch, zoom) {
    var scale = Math.max(cw / srcW, ch / srcH) * zoom;
    var w = srcW * scale, h = srcH * scale;
    return { x: (cw - w) / 2, y: (ch - h) / 2, w: w, h: h };
  }

  function renderHero(p) {
    lastProgress = p;
    var cw = canvas.width, ch = canvas.height;
    if (!cw || !ch) return;
    ctx.clearRect(0, 0, cw, ch);

    var src = null, sw = 0, sh = 0, zoom = 1;
    if (framesReady()) {
      var f = frames[Math.round(p * (frames.length - 1))];
      src = f; sw = f.naturalWidth; sh = f.naturalHeight;
      zoom = 1 + 0.06 * (1 - p);           // whisper of a pull-back on top of the footage
    } else if (videoReady && video.readyState >= 2) {
      src = video; sw = video.videoWidth; sh = video.videoHeight;
      zoom = 1 + 0.06 * (1 - p);
    } else if (imgReady) {
      src = heroImg; sw = heroImg.naturalWidth; sh = heroImg.naturalHeight;
      zoom = 1.22 - 0.22 * p;              // still-image parallax fallback
    }
    if (!src) return;
    var r = coverRect(sw, sh, cw, ch, zoom);
    ctx.drawImage(src, r.x, r.y, r.w, r.h);

    // cyan under-glow pulse near the bays (scroll-clocked, not time-clocked)
    var pulse = 0.05 + 0.045 * (0.5 + 0.5 * Math.sin(p * Math.PI * 4));
    var g = ctx.createRadialGradient(cw * 0.5, ch * 0.92, 0, cw * 0.5, ch * 0.92, cw * 0.45);
    g.addColorStop(0, 'rgba(127, 232, 255, ' + pulse.toFixed(3) + ')');
    g.addColorStop(1, 'rgba(127, 232, 255, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cw, ch);

    // exposure: dark open, lift, then dip to black to hand off to story
    var dark = 0.38 * (1 - Math.min(p / 0.35, 1)) + 0.9 * Math.max((p - 0.82) / 0.18, 0);
    if (dark > 0.003) {
      ctx.fillStyle = 'rgba(0, 0, 0, ' + Math.min(dark, 1).toFixed(3) + ')';
      ctx.fillRect(0, 0, cw, ch);
    }

    // vignette
    var v = ctx.createRadialGradient(cw / 2, ch / 2, ch * 0.35, cw / 2, ch / 2, ch * 0.95);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, cw, ch);
  }

  heroImg.onload = function () { imgReady = true; sizeCanvas(); renderHero(lastProgress); };
  heroImg.src = 'assets/media/hero-still.jpg';

  if (!reduced) {
    // Fallback path: scrub the mp4 playhead (laggier — mp4 seeks decode
    // from the previous keyframe). Only engaged when frames are absent.
    var startVideoFallback = function () {
      var markVideoReady = function () { videoReady = true; renderHero(lastProgress); };
      video.addEventListener('loadeddata', markVideoReady);
      video.addEventListener('error', function () { videoReady = false; });
      // the cached video can finish loading before this script runs —
      // the event listener alone would then never fire
      if (video.readyState >= 2) markVideoReady(); else video.load();

      gsap.ticker.add(function () {
        if (framesReady()) return;
        if (window.scrollY > innerHeight * 4) return;   // hero long gone
        smoothT += (lastProgress - smoothT) * 0.14;
        if (videoReady && video.duration) {
          var desired = Math.min(smoothT, 0.999) * (video.duration - 0.05);
          if (Math.abs(video.currentTime - desired) > 0.02 && video.seekable.length) {
            try { video.currentTime = desired; } catch (e) { /* seek not ready yet */ }
          }
        }
        renderHero(lastProgress);
      });
    };

    // Preferred path: pre-extracted JPEG frame sequence — no decoder seeks,
    // so scrubbing costs one drawImage per scroll update.
    fetch('assets/hero/frames/manifest.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (m) {
        if (!m || !m.count) { startVideoFallback(); return; }
        frames = [];
        for (var i = 1; i <= m.count; i++) {
          var im = new Image();
          im.onload = im.onerror = function () {
            framesLoaded++;
            if (framesReady()) renderHero(lastProgress);
          };
          im.src = 'assets/hero/frames/frame_' + String(i).padStart(4, '0') + '.jpg';
          frames.push(im);
        }
      })
      .catch(startVideoFallback);
  }

  window.addEventListener('resize', function () { sizeCanvas(); renderHero(lastProgress); });
  sizeCanvas();

  if (!reduced) {
    // Intro fades the content wrapper only — the title's letter-spacing and
    // opacity are owned exclusively by the scrub timeline below (sharing
    // properties between a load tween and a scrub tween corrupts the scrub's
    // captured start values).
    gsap.from('.hero__content', { opacity: 0, y: 30, duration: 1.6, ease: 'power3.out', delay: 0.25 });
  }

  if (reduced) {
    // Static fallback: everything visible, no pins, no scrub
    renderHero(0.3);
    document.getElementById('uc1-countdown').style.opacity = '1';
    return;
  }

  var heroTl = gsap.timeline({
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: '+=280%',
      pin: '.hero__stage',
      scrub: true,
      onUpdate: function (self) { renderHero(self.progress); }
    }
  });
  heroTl
    .to('.hero__bar--top',    { scaleY: 0, ease: 'none', duration: 0.4 }, 0)
    .to('.hero__bar--bottom', { scaleY: 0, ease: 'none', duration: 0.4 }, 0)
    .fromTo('#hero-cue',      { opacity: 1 }, { opacity: 0, duration: 0.08, immediateRender: false }, 0)
    .to('#hero-title',        { letterSpacing: '0.14em', ease: 'none', duration: 0.45 }, 0)
    .to('#hero-sub',          { opacity: 1, duration: 0.15 }, 0.22)
    .to('#hero-title',        { opacity: 0, y: -60, duration: 0.25 }, 0.6)
    .to('#hero-sub',          { opacity: 0, y: -30, duration: 0.2 }, 0.68);

  /* ============================================================
     STORY — pinned line reveals + sensor feed + overhead loop
  ============================================================ */
  var storyTl = gsap.timeline({
    scrollTrigger: {
      trigger: '#story',
      start: 'top top',
      end: '+=160%',
      pin: '.story__stage',
      scrub: true
    }
  });
  storyTl
    .from('.story__eyebrow', { opacity: 0, y: 20, duration: 0.12 }, 0.02)
    .from('[data-line]', { opacity: 0, y: 60, stagger: 0.14, duration: 0.3, ease: 'power2.out' }, 0.08)
    .from('[data-feed]', { opacity: 0, x: -14, stagger: 0.12, duration: 0.18 }, 0.55);

  /* ============================================================
     USE CASE 1 — sensor blink → countdown → handshake → dispatch
  ============================================================ */
  var bay = document.getElementById('uc1-bay');
  var ping = document.getElementById('uc1-ping');
  var ping2 = document.getElementById('uc1-ping2');
  var countdownEl = document.getElementById('uc1-countdown');
  var route = document.getElementById('uc1-route');
  var routeLen = route.getTotalLength();
  route.style.strokeDasharray = routeLen;
  route.style.strokeDashoffset = routeLen;
  var handshake = document.getElementById('uc1-handshake');
  var hsLen = handshake.getTotalLength();
  var glid = document.getElementById('uc1-glid');
  var glidLabel = document.getElementById('uc1-glid-label');
  var steps = document.querySelectorAll('.uc1__step');

  function seg(p, a, b) { return Math.max(0, Math.min(1, (p - a) / (b - a))); }

  function uc1Update(p) {
    var active = p < 0.18 ? 0 : p < 0.5 ? 1 : p < 0.66 ? 2 : 3;
    steps.forEach(function (s, i) { s.classList.toggle('is-active', i === active); });

    // phase 0 — sensor blink: expanding scroll-clocked ping rings
    var blink = seg(p, 0, 0.2);
    [ping, ping2].forEach(function (el, i) {
      var t = (blink * 2.2 + i * 0.5) % 1;
      el.setAttribute('r', 8 + t * 30);
      el.style.opacity = blink > 0 && blink < 1 ? String(0.8 * (1 - t)) : '0';
    });

    // phase 1 — countdown 4:00 → 0:00 laid over the drone feed
    var cd = seg(p, 0.18, 0.5);
    var secs = Math.round(240 * (1 - cd));
    countdownEl.textContent = Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0');
    countdownEl.style.opacity = p > 0.14 && p < 0.56 ? '1' : '0';
    countdownEl.style.color = secs <= 30 ? 'var(--red)' : secs <= 120 ? 'var(--amber)' : 'var(--ink)';

    // bay state color
    if (p < 0.18)      { bay.style.fill = 'rgba(127,232,255,0.25)'; bay.style.stroke = '#7fe8ff'; }
    else if (p < 0.5)  { bay.style.fill = 'rgba(217,161,59,0.22)'; bay.style.stroke = '#d9a13b'; }
    else               { bay.style.fill = 'rgba(232,74,63,0.3)';   bay.style.stroke = '#e84a3f'; }

    // phase 2 — Parkin handshake draw
    var hs = seg(p, 0.5, 0.62);
    document.getElementById('uc1-parkin').style.opacity = String(hs);
    handshake.style.strokeDasharray = hsLen;
    handshake.style.strokeDashoffset = String(hsLen * (1 - hs));
    handshake.style.opacity = hs > 0 ? '1' : '0';

    // phase 3 — Glid reroute along path
    var drive = seg(p, 0.64, 0.97);
    route.style.opacity = drive > 0 ? '0.9' : '0';
    route.style.strokeDashoffset = String(routeLen * (1 - drive));
    if (drive > 0) {
      var pt = route.getPointAtLength(routeLen * drive);
      var ahead = route.getPointAtLength(Math.min(routeLen, routeLen * drive + 2));
      var ang = Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180 / Math.PI;
      glid.setAttribute('transform', 'translate(' + pt.x + ' ' + pt.y + ') rotate(' + ang + ')');
      glid.style.opacity = '1';
      glidLabel.setAttribute('x', pt.x + 20);
      glidLabel.setAttribute('y', pt.y - 12);
      glidLabel.style.opacity = '0.9';
    } else {
      glid.style.opacity = '0';
      glidLabel.style.opacity = '0';
    }

    document.getElementById('uc1-verdict').style.opacity = p > 0.93 ? '1' : '0';
  }

  ScrollTrigger.create({
    trigger: '#uc1',
    start: 'top top',
    end: '+=380%',
    pin: '.uc1__stage',
    scrub: true,
    onUpdate: function (self) { uc1Update(self.progress); }
  });
  uc1Update(0);

  /* ============================================================
     USE CASE 2 — driver POV, parking whisper
  ============================================================ */
  var uc2Route = document.getElementById('uc2-route');
  var uc2Len = uc2Route.getTotalLength();
  var chevron = document.getElementById('uc2-chevron');
  var etaEl = document.getElementById('uc2-eta');
  var uc2Lines = document.querySelectorAll('[data-uc2line]');
  var bays = [
    document.getElementById('uc2-bay-a'),
    document.getElementById('uc2-bay-b'),
    document.getElementById('uc2-bay-c')
  ];

  function uc2Update(p) {
    var drive = seg(p, 0.05, 0.88);
    var pt = uc2Route.getPointAtLength(uc2Len * drive);
    var ahead = uc2Route.getPointAtLength(Math.min(uc2Len, uc2Len * drive + 2));
    var ang = Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180 / Math.PI + 90;
    chevron.setAttribute('transform', 'translate(' + pt.x + ' ' + pt.y + ') rotate(' + ang + ')');

    var etaMin = Math.max(0, Math.ceil(8 * (1 - drive)));
    etaEl.textContent = drive >= 1 ? 'DIFC · ARRIVED' : 'DIFC · ' + etaMin + ' MIN';

    bays.forEach(function (b, i) {
      var t = seg(p, 0.22 + i * 0.1, 0.3 + i * 0.1);
      b.style.opacity = String(t);
      b.querySelector('.uc2-bay__ring').setAttribute('r', 8 + 8 * ((p * 6 + i * 0.33) % 1));
    });

    var pick = seg(p, 0.58, 0.66);
    document.getElementById('uc2-chip').style.opacity = String(pick);
    document.getElementById('uc2-chip').style.transform =
      'translate(-50%, ' + (8 - 16 * pick) + 'px)';
    bays[1].style.opacity = String(Math.min(1, seg(p, 0.32, 0.4)) * (1 - 0.75 * pick));
    bays[2].style.opacity = String(Math.min(1, seg(p, 0.42, 0.5)) * (1 - 0.75 * pick));

    var hold = Math.round(180 * (1 - seg(p, 0.66, 1) * 0.35));
    document.getElementById('uc2-chip-timer').textContent =
      Math.floor(hold / 60) + ':' + String(hold % 60).padStart(2, '0');

    uc2Lines.forEach(function (l, i) {
      l.style.opacity = String(seg(p, 0.12 + i * 0.22, 0.2 + i * 0.22));
    });
  }

  ScrollTrigger.create({
    trigger: '#uc2',
    start: 'top top',
    end: '+=320%',
    pin: '.uc2__stage',
    scrub: true,
    onUpdate: function (self) { uc2Update(self.progress); }
  });
  uc2Update(0);

  gsap.from('.uc2__screen', {
    scrollTrigger: { trigger: '#uc2', start: 'top 70%', end: 'top top', scrub: true },
    y: '14vh', opacity: 0.3, ease: 'none'
  });

  /* ============================================================
     ARCHITECTURE — draw-on diagram
  ============================================================ */
  document.querySelectorAll('#arch-svg [data-wire]').forEach(function (w) {
    var len = w.getTotalLength();
    w.style.strokeDasharray = len;
    w.style.strokeDashoffset = len;
  });

  var archTl = gsap.timeline({
    scrollTrigger: { trigger: '#arch', start: 'top 65%', end: 'bottom 90%', scrub: true }
  });
  archTl
    .to('[data-arch="1"]', { opacity: 1, stagger: 0.06, duration: 0.12 }, 0)
    .to('#arch-svg [data-wire]', { strokeDashoffset: 0, stagger: 0.05, duration: 0.3, ease: 'none' }, 0.08)
    .to('[data-arch="2"]', { opacity: 1, duration: 0.12 }, 0.18)
    .to('[data-arch="3"]', { opacity: 1, stagger: 0.06, duration: 0.12 }, 0.32)
    .to('[data-arch="4"]', { opacity: 1, stagger: 0.05, duration: 0.12 }, 0.48)
    .to('[data-arch="5"]', { opacity: 1, duration: 0.12 }, 0.62)
    .to('[data-arch="6"]', { opacity: 1, duration: 0.15 }, 0.75)
    .from('.arch-col-label', { opacity: 0, duration: 0.1 }, 0);

  /* ============================================================
     IMPACT — count-ups (projections)
  ============================================================ */
  document.querySelectorAll('.impact__num').forEach(function (el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var proxy = { v: 0 };
    gsap.to(proxy, {
      v: target,
      duration: 1.6,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' },
      onUpdate: function () {
        el.innerHTML = prefix + Math.round(proxy.v) + suffix;
      }
    });
  });
  gsap.from('.impact__eyebrow, .impact__note', {
    scrollTrigger: { trigger: '#impact', start: 'top 80%' },
    opacity: 0, y: 20, duration: 0.8, stagger: 0.2
  });

  /* ============================================================
     PILOT CTA + generic reveal groups (hardware, handoff,
     team, faq)
  ============================================================ */
  gsap.from('[data-pilot]', {
    scrollTrigger: { trigger: '#pilot', start: 'top 72%' },
    opacity: 0, y: 46, duration: 0.9, stagger: 0.12, ease: 'power3.out'
  });

  document.querySelectorAll('[data-reveal-group]').forEach(function (group) {
    gsap.from(group.querySelectorAll('[data-reveal]'), {
      scrollTrigger: { trigger: group, start: 'top 74%' },
      opacity: 0, y: 40, duration: 0.9, stagger: 0.12, ease: 'power3.out'
    });
  });

  ScrollTrigger.refresh();
})();
