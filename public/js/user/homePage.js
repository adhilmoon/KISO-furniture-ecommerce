/* ─────────────────────────────────────────────────────────────────────────
   Hero scrollytelling — canvas image-sequence scrub (Apple-style).

   Scroll position over #scrolly-container maps to a frame index; the matching
   preloaded image is drawn to #sofa-canvas with a cover fit. A small eased
   glide between target/displayed frames keeps the scrub smooth instead of
   snapping. Step text overlays + nav darkening ride on the same progress.
   ───────────────────────────────────────────────────────────────────────── */

let ticking = false;
let currentActiveStep = -1;
let isNavDark = false;

const canvas = document.getElementById('sofa-canvas');
const container = document.getElementById('scrolly-container');
const steps = document.querySelectorAll('.step');
const progressBar = document.getElementById('progress-bar');
const nav = document.getElementById('main-nav');

const ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null;

// ── Frame config (from canvas data-*) ──────────────────────────────────────
const FRAME_COUNT = canvas ? parseInt(canvas.dataset.frameCount, 10) || 0 : 0;
const FRAME_PATH = canvas ? (canvas.dataset.framePath || '/images/hero/frame-') : '';
const FRAME_PAD = canvas ? parseInt(canvas.dataset.framePad, 10) || 4 : 4;
const FRAME_EXT = canvas ? (canvas.dataset.frameExt || '.jpg') : '.jpg';

const frames = [];          // Image objects, index 0..FRAME_COUNT-1
let loadedCount = 0;
let framesReady = false;

// Eased scrub: scroll sets targetFrame, a rAF loop glides displayedFrame toward it.
let targetFrame = 0;
let displayedFrame = 0;
let drawRaf = null;
const EASE = 0.2;           // 0..1 — higher = snappier, lower = smoother
const SNAP_EPS = 0.25;      // stop easing within a quarter-frame

const frameUrl = (i) => `${FRAME_PATH}${String(i + 1).padStart(FRAME_PAD, '0')}${FRAME_EXT}`;

// ── Canvas sizing (crisp on HiDPI) ─────────────────────────────────────────
function sizeCanvas() {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2x to bound payload
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
}

// Draw image with object-fit: cover into the full canvas.
function drawCover(img) {
    if (!ctx || !img || !img.complete || !img.naturalWidth) return;
    const cw = canvas.width;
    const ch = canvas.height;
    const ir = img.naturalWidth / img.naturalHeight;
    const cr = cw / ch;
    let dw, dh;
    if (cr > ir) { dw = cw; dh = cw / ir; }
    else { dh = ch; dw = ch * ir; }
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
}

// Pick the nearest already-loaded frame to `idx` so we never draw a blank
// canvas while later frames are still streaming in.
function nearestLoaded(idx) {
    if (frames[idx] && frames[idx].complete && frames[idx].naturalWidth) return frames[idx];
    for (let d = 1; d < FRAME_COUNT; d++) {
        const lo = frames[idx - d];
        if (lo && lo.complete && lo.naturalWidth) return lo;
        const hi = frames[idx + d];
        if (hi && hi.complete && hi.naturalWidth) return hi;
    }
    return null;
}

function renderFrame(idx) {
    const clamped = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(idx)));
    const img = nearestLoaded(clamped);
    if (img) drawCover(img);
}

function scrubStep() {
    drawRaf = null;
    const diff = targetFrame - displayedFrame;
    if (Math.abs(diff) <= SNAP_EPS) {
        displayedFrame = targetFrame;
        renderFrame(displayedFrame);
        return;
    }
    displayedFrame += diff * EASE;
    renderFrame(displayedFrame);
    startScrub();
}

function startScrub() {
    if (drawRaf === null) drawRaf = window.requestAnimationFrame(scrubStep);
}

// ── Scroll → progress → frame + overlays ────────────────────────────────────
function updateScrollBasedContent() {
    if (!container) { ticking = false; return; }
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const containerOffset = container.offsetTop;
    const containerHeight = container.scrollHeight;

    let progress = (scrollTop - containerOffset) / (containerHeight - window.innerHeight);
    progress = Math.max(0, Math.min(1, progress));

    if (framesReady || loadedCount > 0) {
        targetFrame = progress * (FRAME_COUNT - 1);
        startScrub();
    }
    updateUI(progress * 100);
    ticking = false;
}

function updateUI(percent) {
    if (progressBar) progressBar.style.width = `${percent}%`;

    const shouldNavBeDark = percent > 1;
    if (shouldNavBeDark !== isNavDark && nav) {
        nav.classList.toggle('bg-transparent', !shouldNavBeDark);
        nav.classList.toggle('bg-black/40', shouldNavBeDark);
        nav.classList.toggle('backdrop-blur-md', shouldNavBeDark);
        isNavDark = shouldNavBeDark;
    }

    let newActiveStep = -1;
    steps.forEach((step, index) => {
        const start = parseFloat(step.dataset.start);
        const end = parseFloat(step.dataset.end);
        if (percent >= start && percent <= end) newActiveStep = index;
    });

    if (newActiveStep !== currentActiveStep) {
        steps.forEach((step, index) => {
            const active = index === newActiveStep;
            step.style.opacity = active ? '1' : '0';
            step.style.transform = active ? 'translateY(0)' : 'translateY(20px)';
            step.style.pointerEvents = active ? 'auto' : 'none';
            step.style.visibility = active ? 'visible' : 'hidden';
        });
        currentActiveStep = newActiveStep;
    }
}

// ── Preload ─────────────────────────────────────────────────────────────────
function preloadFrames() {
    if (!canvas || FRAME_COUNT <= 0) return;
    for (let i = 0; i < FRAME_COUNT; i++) {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
            loadedCount++;
            // Draw the first available frame immediately so the hero is never
            // blank, then keep the current scroll frame in sync as more arrive.
            if (loadedCount === 1) renderFrame(displayedFrame);
            if (loadedCount === FRAME_COUNT) framesReady = true;
            if (Math.round(targetFrame) === i) renderFrame(targetFrame);
        };
        img.src = frameUrl(i);
        frames[i] = img;
    }
}

// ── Init ─────────────────────────────────────────────────────────────────────
function init() {
    if (!canvas) return;
    sizeCanvas();
    preloadFrames();
    updateScrollBasedContent();
}

window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(updateScrollBasedContent);
        ticking = true;
    }
}, { passive: true });

window.addEventListener('resize', () => {
    sizeCanvas();
    renderFrame(displayedFrame);
    updateScrollBasedContent();
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
