// Keeps the header cart/wishlist badges in sync after in-page add/remove
// actions (pages that reload get fresh server-rendered badges already).
(function () {
    function setBadge(id, count) {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = count;
        el.classList.toggle('hidden', !(count > 0));
    }

    window.setNavBadges = function ({ cartCount, wishlistCount }) {
        if (typeof cartCount === 'number') setBadge('cartBadge', cartCount);
        if (typeof wishlistCount === 'number') setBadge('wishlistBadge', wishlistCount);
    };

    window.refreshNavBadges = async function () {
        try {
            const { data } = await axios.get('/user/badge-counts');
            if (data && data.success) {
                window.setNavBadges({ cartCount: data.cartCount, wishlistCount: data.wishlistCount });
            }
        } catch {
            /* non-critical: badges stay as-is until next page load */
        }
    };
})();
