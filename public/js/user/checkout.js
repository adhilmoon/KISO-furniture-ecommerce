document.addEventListener('DOMContentLoaded', () => {
    const checkoutBtn = document.getElementById('btnContinueToPayment');
    const applyCouponBtn = document.getElementById('applyCouponBtn');
    const couponInput = document.getElementById('coupon');

    // Handle Checkout Redirection
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async () => {
            const selectedAddress = document.querySelector('input[name="selectedAddress"]:checked');
            
            if (!selectedAddress) {
                if (typeof confirmAction === 'function') {
                    await confirmAction('Please select a delivery address to proceed.', 'info');
                } else {
                    alert('Please select a delivery address to proceed.');
                }
                return;
            }

            // Show Loading State
            const originalText = checkoutBtn.innerHTML;
            checkoutBtn.disabled = true;
            checkoutBtn.innerHTML = `<svg class="animate-spin h-5 w-5 text-brand-bg1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg> Processing...`;

            const addressId = selectedAddress.value;
            const useWallet = document.getElementById('useWalletToggle')?.checked ? '1' : '0';

            setTimeout(() => {
                window.location.href = `/user/checkout/payment?addressId=${addressId}&useWallet=${useWallet}`;
            }, 800);
        });
    }

    // Handle Coupon Application
    if (applyCouponBtn) {
        applyCouponBtn.addEventListener('click', async () => {
            const couponCode = couponInput.value.trim();
            if (!couponCode) {
                if (window.showToast) showToast('Please enter a coupon code', 'warning');
                return;
            }
            applyCouponBtn.disabled = true;
            applyCouponBtn.innerText = 'Checking...';
            try {
                const res = await axios.post('/user/coupon/apply', { code: couponCode });
                if (res.data.success) {
                    if (window.showToast) showToast(res.data.message, 'success');
                    setTimeout(() => window.location.reload(), 800);
                }
            } catch (err) {
                if (window.showToast) showToast(err.response?.data?.message || 'Failed to apply coupon', 'error');
                applyCouponBtn.disabled = false;
                applyCouponBtn.innerText = 'Apply';
            }
        });
    }

    // Handle Coupon Removal
    const removeCouponBtn = document.getElementById('removeCouponBtn');
    if (removeCouponBtn) {
        removeCouponBtn.addEventListener('click', async () => {
            removeCouponBtn.disabled = true;
            removeCouponBtn.innerText = 'Removing...';
            try {
                const res = await axios.delete('/user/coupon');
                if (res.data.success) {
                    if (window.showToast) showToast(res.data.message, 'success');
                    setTimeout(() => window.location.reload(), 600);
                }
            } catch (err) {
                if (window.showToast) showToast(err.response?.data?.message || 'Failed to remove coupon', 'error');
                removeCouponBtn.disabled = false;
                removeCouponBtn.innerText = 'Remove';
            }
        });
    }

    // View available coupons
    const viewCouponsBtn = document.getElementById('viewCouponsBtn');
    const couponsModal = document.getElementById('couponsModal');
    const couponsList = document.getElementById('couponsList');
    const closeCouponsBtn = document.getElementById('closeCouponsBtn');

    const escapeHtml = (str) => String(str).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);

    const formatDiscount = (c) => c.discountType === 'percentage'
        ? `${c.discountValue}% off${c.maxDiscount ? ` (up to ₹${c.maxDiscount.toLocaleString('en-IN')})` : ''}`
        : `₹${c.discountValue.toLocaleString('en-IN')} off`;

    const renderCoupons = (coupons, appliedCode) => {
        if (!coupons.length) {
            couponsList.innerHTML = '<p class="text-sm text-brand-muted text-center py-6">No coupons available right now.</p>';
            return;
        }
        couponsList.innerHTML = coupons.map(c => {
            const isApplied = appliedCode && appliedCode === c.code;
            const action = isApplied
                ? '<span class="px-3 py-1.5 text-xs font-bold text-green-400">Applied</span>'
                : c.eligible
                    ? `<button type="button" data-apply-code="${escapeHtml(c.code)}" class="px-3 py-1.5 text-xs font-bold text-brand-bg1 bg-brand-accent rounded-lg hover:bg-yellow-500 transition-colors">Apply</button>`
                    : `<span class="text-[10px] text-red-400 text-right max-w-[110px]">${escapeHtml(c.reason)}</span>`;
            return `
                <div class="flex items-center justify-between gap-3 p-3 rounded-xl border ${c.eligible ? 'border-brand-accent/30 bg-brand-bg1' : 'border-white/8 bg-brand-bg1/50 opacity-70'}">
                    <div class="min-w-0">
                        <p class="text-sm font-bold text-brand-accent">${escapeHtml(c.code)}</p>
                        <p class="text-[11px] text-brand-light">${formatDiscount(c)}</p>
                        ${c.description ? `<p class="text-[10px] text-brand-muted truncate">${escapeHtml(c.description)}</p>` : ''}
                        ${c.minPurchase ? `<p class="text-[10px] text-brand-muted">Min order ₹${c.minPurchase.toLocaleString('en-IN')}</p>` : ''}
                    </div>
                    ${action}
                </div>`;
        }).join('');
    };

    const applyCode = async (code) => {
        try {
            const res = await axios.post('/user/coupon/apply', { code });
            if (res.data.success) {
                if (window.showToast) showToast(res.data.message, 'success');
                setTimeout(() => window.location.reload(), 700);
            }
        } catch (err) {
            if (window.showToast) showToast(err.response?.data?.message || 'Failed to apply coupon', 'error');
        }
    };

    if (viewCouponsBtn && couponsModal) {
        const closeModal = () => couponsModal.classList.add('hidden');

        viewCouponsBtn.addEventListener('click', async () => {
            couponsModal.classList.remove('hidden');
            couponsList.innerHTML = '<p class="text-sm text-brand-muted text-center py-6">Loading…</p>';
            try {
                const { data } = await axios.get('/user/coupons/available');
                if (data.success) renderCoupons(data.coupons, data.appliedCode);
            } catch {
                couponsList.innerHTML = '<p class="text-sm text-red-400 text-center py-6">Could not load coupons.</p>';
            }
        });

        closeCouponsBtn?.addEventListener('click', closeModal);
        couponsModal.addEventListener('click', (e) => { if (e.target === couponsModal) closeModal(); });
        couponsList.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-apply-code]');
            if (btn) applyCode(btn.dataset.applyCode);
        });
    }
});
