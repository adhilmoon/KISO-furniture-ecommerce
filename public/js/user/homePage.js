let ticking = false;
let currentActiveStep = -1;
let isNavDark = false;
let videoReady = false;

const video = document.getElementById('sofa-video');
const container = document.getElementById('scrolly-container');
const steps = document.querySelectorAll('.step');
const progressBar = document.getElementById('progress-bar');
const nav = document.getElementById('main-nav');

let pendingSeek = null;
let seekInFlight = false;

if (video) {
    video.pause();
    video.addEventListener('loadedmetadata', () => video.pause());
    video.addEventListener('canplaythrough', () => {
        videoReady = true;
        video.pause();
        if (progressBar) progressBar.style.width = '100%';
        updateScrollBasedContent();
    });
    video.addEventListener('play', () => video.pause());
    video.addEventListener('seeked', () => {
        seekInFlight = false;
        if (pendingSeek !== null) {
            const t = pendingSeek;
            pendingSeek = null;
            if (Math.abs(video.currentTime - t) > 0.05) {
                seekInFlight = true;
                try { video.currentTime = t; } catch (_) { seekInFlight = false; }
            }
        }
    });
    video.addEventListener('error', () => {
        console.warn('sofa video failed to load');
    });
    video.load();
}

const setVideoTime = (t) => {
    if (!videoReady || !video) return;
    if (!video.paused) video.pause();
    if (Math.abs(video.currentTime - t) < 0.05) return;
    if (seekInFlight) {
        pendingSeek = t;
        return;
    }
    seekInFlight = true;
    try { video.currentTime = t; } catch (_) { seekInFlight = false; }
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
