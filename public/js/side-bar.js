
document.addEventListener('DOMContentLoaded', function() {
    // Helper function to handle Sidebar
    function setupSidebar(toggleId, menuId, overlayId, closeId) {
        const toggle = document.getElementById(toggleId);
        const menu = document.getElementById(menuId);
        const overlay = document.getElementById(overlayId);
        const close = document.getElementById(closeId);

        if (!toggle || !menu || !overlay) return;

        const open = () => {
            menu.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        };

        const hide = () => {
            menu.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
            document.body.style.overflow = '';
        };

        toggle.onclick = open;
        close.onclick = hide;
        overlay.onclick = hide;
    }

    // Initialize both based on availability
    setupSidebar('mobile-menu-btn', 'mobile-sidebar', 'mobile-sidebar-overlay', 'close-sidebar');
    setupSidebar('mobile-profile-sidebar-toggle', 'profile-sidebar-menu', 'profile-sidebar-overlay', 'close-profile-sidebar');
});
