window.addEventListener('pageshow', function (event) {

    if(event.persisted || (window.performance && window.performance.navigation.type === 2)) {
        window.location.reload();
    }
});
document.addEventListener('DOMContentLoaded', () => {
    const nav = document.getElementById('main-nav');
    if(nav && window.location.pathname !== '/') {
        const isProfilePage = Boolean("<%= locals.isProfilePage === true ? 'true' : '' %>");

        const handleScroll = () => {
            if(window.scrollY > 50) {
                nav.classList.add('bg-black/40', 'backdrop-blur-md');
                nav.classList.remove('bg-transparent', 'bg-brand-bg1');
            } else {
                nav.classList.remove('bg-black/40', 'backdrop-blur-md');
                if(isProfilePage) {
                    nav.classList.add('bg-brand-bg1');
                } else {
                    nav.classList.add('bg-transparent');
                }
            }
        };

        window.addEventListener('scroll', handleScroll, {passive: true});
        handleScroll();
    }
});
