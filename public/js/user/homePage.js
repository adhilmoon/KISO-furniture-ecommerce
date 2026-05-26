let ticking = false;
let currentActiveStep = -1;
let isNavDark = false;
let videoReady = false;

const video = document.getElementById('sofa-video');
const fallbackFrame = document.getElementById('sofa-video-frame');
const container = document.getElementById('scrolly-container');
const steps = document.querySelectorAll('.step');
const progressBar = document.getElementById('progress-bar');
const nav = document.getElementById('main-nav');

// Eased scrub state: scroll sets targetTime, a rAF loop glides currentTime toward it.
let targetTime = 0;
let seekInFlight = false;
let scrubRaf = null;
const EASE = 0.18;        // 0..1 — higher = snappier, lower = smoother/laggier
const SNAP_EPS = 0.01;    // stop easing when within this many seconds

// Swap to the looping Gumlet iframe if the native file can't play.
function useFallback() {
    if (!fallbackFrame) return;
    fallbackFrame.classList.remove('hidden');
    if (video) video.classList.add('hidden');
    videoReady = false;
}

if (video) {
    video.pause();
    video.addEventListener('loadedmetadata', () => video.pause());
    video.addEventListener('canplaythrough', () => {
        if (!isFinite(video.duration)) { useFallback(); return; }
        videoReady = true;
        video.pause();
        if (progressBar) progressBar.style.width = '100%';
        updateScrollBasedContent();
    });
    // Native bg video should never auto-play; scroll drives time only.
    video.addEventListener('play', () => video.pause());
    video.addEventListener('seeked', () => {
        seekInFlight = false;
        // Keep gliding if scroll moved the target while a seek was resolving.
        if (videoReady && Math.abs(targetTime - video.currentTime) > SNAP_EPS) startScrub();
    });
    video.addEventListener('error', () => {
        console.warn('sofa video failed to load — using iframe fallback');
        useFallback();
    });
    video.load();
} else {
    // No native element at all → ensure fallback iframe is visible.
    useFallback();
}

// Glide currentTime toward targetTime; one in-flight seek at a time avoids
// the hard-seek stutter ("hesitation") of jumping straight to the scroll value.
function scrubStep() {
    scrubRaf = null;
    if (!videoReady || !video) return;
    const cur = video.currentTime;
    const diff = targetTime - cur;
    if (Math.abs(diff) <= SNAP_EPS) return;
    if (seekInFlight) { startScrub(); return; }
    const next = cur + diff * EASE;
    seekInFlight = true;
    try { video.currentTime = next; } catch (_) { seekInFlight = false; }
    startScrub();
}

function startScrub() {
    if (scrubRaf === null) scrubRaf = window.requestAnimationFrame(scrubStep);
}

const setVideoTime = (t) => {
    if (!videoReady || !video) return;
    targetTime = t;
    startScrub();
};

function updateScrollBasedContent() {
    if (!container) return;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const containerOffset = container.offsetTop;
    const containerHeight = container.scrollHeight;

    let progress = (scrollTop - containerOffset) / (containerHeight - window.innerHeight);
    progress = Math.max(0, Math.min(1, progress));

    if (videoReady && isFinite(video.duration)) {
        setVideoTime(progress * video.duration);
    }
    updateUI(progress * 100);
    ticking = false;
}

function updateUI(percent) {
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

window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(updateScrollBasedContent);
        ticking = true;
    }
}, { passive: true });

window.addEventListener('resize', updateScrollBasedContent);

updateScrollBasedContent();
