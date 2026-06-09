(function () {
    const slider = document.getElementById('bannerSlider');
    if (!slider) return;

    const slides = Array.from(slider.querySelectorAll('.banner-slide'));
    const dots = Array.from(slider.querySelectorAll('[data-banner-dot]'));
    const prevBtn = slider.querySelector('[data-banner-prev]');
    const nextBtn = slider.querySelector('[data-banner-next]');
    const counter = slider.querySelector('[data-banner-counter]');
    const autoplayMs = parseInt(slider.dataset.autoplay, 10) || 6000;

    if (slides.length === 0) return;

    let active = 0;
    let timer = null;

    const show = (index) => {
        active = (index + slides.length) % slides.length;
        slides.forEach((s, i) => {
            const on = i === active;
            s.classList.toggle('opacity-100', on);
            s.classList.toggle('opacity-0', !on);
            s.classList.toggle('pointer-events-none', !on);
        });
        dots.forEach((d, i) => {
            const on = i === active;
            d.style.backgroundColor = on ? '#D8FF3E' : '';
            d.classList.toggle('bg-white/30', !on);
        });
        if (counter) counter.textContent = String(active + 1).padStart(2, '0');
        const bg = slides[active].dataset.bg;
        if (bg) slider.style.background = bg;
    };

    const next = () => show(active + 1);
    const prev = () => show(active - 1);

    const start = () => {
        if (slides.length < 2) return;
        stop();
        timer = setInterval(next, autoplayMs);
    };
    const stop = () => {
        if (timer) clearInterval(timer);
        timer = null;
    };

    prevBtn?.addEventListener('click', () => { prev(); start(); });
    nextBtn?.addEventListener('click', () => { next(); start(); });
    dots.forEach((d, i) => d.addEventListener('click', () => { show(i); start(); }));

    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);

    // Pause when tab hidden
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop(); else start();
    });

    show(0);
    start();
})();
