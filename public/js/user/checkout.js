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
});
