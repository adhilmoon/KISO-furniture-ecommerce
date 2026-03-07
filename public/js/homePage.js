let lastDrawnIndex = 0;
let ticking = false;
let currentActiveStep = -1;
let isNavDark = false;

const canvas = document.getElementById('sofa-canvas');
const context = canvas.getContext('2d');
const container = document.getElementById('scrolly-container');
const steps = document.querySelectorAll('.step');
const progressBar = document.getElementById('progress-bar');
const nav = document.getElementById('main-nav');

const frameCount = 192;
const currentFrame = index => `/assets/sofa-sequence/${index.toString().padStart(5, '0')}.jpg`;

const images = [];
let imagesLoaded = 0;

// Preload images efficiently in batches so it doesn't freeze the browser
const preloadImages = () => {
    // 1. Immediately load the first frame so it paints instantly
    const firstImg = new Image();
    firstImg.src = currentFrame(1);
    firstImg.onload = () => {
        imagesLoaded++;
        images[0] = firstImg;
        render(0);
    };
    firstImg.onerror = () => images[0] = firstImg;
    images[0] = firstImg;

    // 2. Defer preloading the remaining 239 frames until the window finishes critical loading
    window.addEventListener('load', () => {
        let currentIndex = 2; // start from frame 2
        const batchSize = 10; // load 10 frames at a time

        const loadBatch = () => {
            if(currentIndex > frameCount) return;

            let loadedInBatch = 0;
            let currentBatchSize = Math.min(batchSize, frameCount - currentIndex + 1);

            for(let b = 0; b < currentBatchSize; b++) {
                const img = new Image();
                const frameNum = currentIndex + b;
                img.src = currentFrame(frameNum);

                img.onload = img.onerror = () => {
                    imagesLoaded++;
                    loadedInBatch++;
                    if(progressBar) progressBar.style.width = `${(imagesLoaded / frameCount) * 100}%`;

                    // When this batch finishes, wait a frame then start the next batch
                    if(loadedInBatch === currentBatchSize) {
                        requestAnimationFrame(loadBatch);
                    }
                };
                images[frameNum - 1] = img;
            }
            currentIndex += currentBatchSize;
        };

        // Start the sequential background fetching
        loadBatch();
    });
};

// Responsive Canvas
const resizeCanvas = () => {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    updateScrollBasedContent(); // Re-render on resize
};

// Draw logic with object-fit: contain simulation
const drawImageProp = (ctx, img, x, y, w, h, offsetX, offsetY) => {
    if(!img) return;
    offsetX = typeof offsetX === 'number' ? offsetX : 0.5;
    offsetY = typeof offsetY === 'number' ? offsetY : 0.5;
    // This function is now deprecated in favor of the simpler contain logic in render()
};

const render = (index = 0) => {
    let img = images[index];

    // Optimized Fallback: Just use the last successfully drawn image 
    // instead of running an expensive while-loop every frame.
    if(!img || !img.complete) {
        img = images[lastDrawnIndex];
    }

    if(!img || !img.complete) return;

    // Update our successful index
    lastDrawnIndex = images.indexOf(img) > -1 ? images.indexOf(img) : lastDrawnIndex;

    context.clearRect(0, 0, canvas.width, canvas.height);

    const imgRatio = img.width / img.height;
    const canvasRatio = canvas.width / canvas.height;

    let drawWidth, drawHeight, drawX, drawY;

    if(imgRatio > canvasRatio) {
        drawHeight = canvas.height;
        drawWidth = canvas.height * imgRatio;
        drawX = (canvas.width - drawWidth) / 2;
        drawY = 0;
    } else {
        drawWidth = canvas.width;
        drawHeight = canvas.width / imgRatio;
        drawX = 0;
        drawY = (canvas.height - drawHeight) / 2;
    }

    context.drawImage(img, drawX, drawY, drawWidth, drawHeight);
};
const updateScrollBasedContent = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const containerOffset = container.offsetTop;
    const containerHeight = container.scrollHeight;

    let progress = (scrollTop - containerOffset) / (containerHeight - window.innerHeight);
    progress = Math.max(0, Math.min(1, progress));

    const frameIndex = Math.min(
        frameCount - 1,
        Math.floor(progress * (frameCount - 1))
    );

    render(frameIndex);
    updateUI(progress * 100);

    // Reset ticking flag so the next scroll event can fire
    ticking = false;
};
const updateUI = (percent) => {
    // 1. Only update Navbar if the state actually changes
    const shouldNavBeDark = percent > 1;
    if(shouldNavBeDark !== isNavDark) {
        if(shouldNavBeDark) {
            nav.classList.remove('bg-transparent');
            nav.classList.add('bg-black/40', 'backdrop-blur-md');
        } else {
            nav.classList.add('bg-transparent');
            nav.classList.remove('bg-black/40', 'backdrop-blur-md');
        }
        isNavDark = shouldNavBeDark;
    }

    // 2. Find which step SHOULD be active
    let newActiveStep = -1;
    steps.forEach((step, index) => {
        const start = parseFloat(step.dataset.start);
        const end = parseFloat(step.dataset.end);
        if(percent >= start && percent <= end) {
            newActiveStep = index;
        }
    });

    // 3. Only manipulate the DOM if the active step has changed
    if(newActiveStep !== currentActiveStep) {
        steps.forEach((step, index) => {
            if(index === newActiveStep) {
                step.style.opacity = '1';
                step.style.transform = 'translateY(0)';
                step.style.pointerEvents = 'auto';
                step.style.visibility = 'visible'; // Use visibility instead of display
            } else {
                step.style.opacity = '0';
                step.style.transform = 'translateY(20px)';
                step.style.pointerEvents = 'none';
                step.style.visibility = 'hidden'; // Use visibility instead of display
            }
        });
        currentActiveStep = newActiveStep;
    }
};
window.addEventListener('scroll', () => {
    if(!ticking) {
        window.requestAnimationFrame(updateScrollBasedContent);
        ticking = true;
    }
}, {passive: true});

window.addEventListener('resize', resizeCanvas);

resizeCanvas();
preloadImages();

