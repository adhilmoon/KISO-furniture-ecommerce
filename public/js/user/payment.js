function showStockIssuesModal(message, issues) {
    const existing = document.getElementById('stockIssuesModal');
    if (existing) existing.remove();

    const itemsHtml = (issues || []).map(i => `
        <li class="flex items-start gap-2 text-sm text-stone-200">
            <span class="text-red-400 mt-0.5">•</span>
            <span>${escapeHtml(i.message || 'Item unavailable')}</span>
        </li>
    `).join('');

    const wrap = document.createElement('div');
    wrap.id = 'stockIssuesModal';
    wrap.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4';
    wrap.innerHTML = `
        <div class="bg-brand-bg1 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div class="flex items-start gap-3 mb-4">
                <div class="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 text-xl flex-shrink-0">!</div>
                <div>
                    <h3 class="text-lg font-bold text-white">Stock issue</h3>
                    <p class="text-sm text-stone-400 mt-1">${escapeHtml(message || 'Some items in your cart are no longer available.')}</p>
                </div>
            </div>
            ${itemsHtml ? `<ul class="space-y-2 mb-5 max-h-60 overflow-y-auto">${itemsHtml}</ul>` : ''}
            <div class="flex gap-3">
                <button type="button" id="stockIssuesClose"
                    class="flex-1 px-4 py-2.5 border border-white/10 text-stone-200 font-semibold text-sm rounded-xl hover:bg-white/5">
                    Dismiss
                </button>
                <a href="/user/cart"
                    class="flex-1 px-4 py-2.5 bg-brand-accent text-brand-bg1 font-bold text-sm rounded-xl hover:bg-brand-accent/90 text-center">
                    Review Cart
                </a>
            </div>
        </div>
    `;
    document.body.appendChild(wrap);
    wrap.querySelector('#stockIssuesClose').addEventListener('click', () => wrap.remove());
    wrap.addEventListener('click', (e) => { if (e.target === wrap) wrap.remove(); });
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
}

function handlePlacementError(error, fallbackMessage) {
    const data = error?.response?.data;
    if (data && Array.isArray(data.issues) && data.issues.length > 0) {
        showStockIssuesModal(data.message || fallbackMessage, data.issues);
        return true;
    }
    return false;
}

document.addEventListener('DOMContentLoaded', () => {
    const payNowBtn = document.getElementById('payNowBtn');
    const payBtnLabel = document.getElementById('payBtnLabel');

    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', () => {
            if (!payBtnLabel) return;
            if (radio.value === 'cod') payBtnLabel.textContent = 'Place Order (COD)';
            else if (radio.value === 'wallet') payBtnLabel.textContent = 'Pay with Wallet';
            else payBtnLabel.textContent = 'Pay with Razorpay';
        });
    });

    if (!payNowBtn) return;

    payNowBtn.addEventListener('click', async () => {
        const amount = payNowBtn.dataset.amount;
        const razorpayKey = payNowBtn.dataset.razorpayKey;
        const addressId = payNowBtn.dataset.addressId;
        const useWallet = payNowBtn.dataset.useWallet === '1';
        const walletCoversAll = payNowBtn.dataset.walletCoversAll === '1';
        const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'razorpay';

        payNowBtn.disabled = true;
        const originalContent = payNowBtn.innerHTML;
        const spinnerHTML = `<svg class="animate-spin h-5 w-5 text-brand-bg1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;

        const restoreBtn = () => {
            payNowBtn.disabled = false;
            payNowBtn.innerHTML = originalContent;
        };

        try {
            if (walletCoversAll) {
                payNowBtn.innerHTML = `${spinnerHTML} Placing Order...`;
                const response = await axios.post('/user/payment/cod', { addressId, useWallet: true });
                if (response.data.success) {
                    window.location.href = `/user/order/confirmation/${response.data.orderId}`;
                } else {
                    throw new Error(response.data.message || 'Failed to place order');
                }
                return;
            }
            if (selectedMethod === 'wallet') {
                payNowBtn.innerHTML = `${spinnerHTML} Placing Order...`;
                const response = await axios.post('/user/payment/wallet', { addressId });
                if (response.data.success) {
                    window.location.href = `/user/order/confirmation/${response.data.orderId}`;
                } else {
                    throw new Error(response.data.message || 'Failed to place order');
                }
                return;
            }
            if (selectedMethod === 'cod') {
                payNowBtn.innerHTML = `${spinnerHTML} Placing Order...`;
                const response = await axios.post('/user/payment/cod', { addressId, useWallet });
                if (response.data.success) {
                    window.location.href = `/user/order/confirmation/${response.data.orderId}`;
                } else {
                    throw new Error(response.data.message || 'Failed to place order');
                }
                return;
            }

            // Razorpay path — server computes the payable amount from the
            // cart; the client only declares address + wallet preference.
            payNowBtn.innerHTML = `${spinnerHTML} Initializing...`;
            const orderResponse = await axios.post('/user/payment/create-order', { addressId, useWallet });
            if (!orderResponse.data.success) {
                throw new Error('Failed to create payment order');
            }

            const { order } = orderResponse.data;
            const options = {
                key: razorpayKey,
                amount: order.amount,
                currency: order.currency,
                name: "KISO Furniture",
                description: "Order Payment",
                order_id: order.id,
                handler: async function (response) {
                    try {
                        payNowBtn.innerHTML = `${spinnerHTML} Verifying Payment...`;
                        // Address + wallet usage are read from the trusted
                        // Razorpay order notes server-side, not sent here.
                        const verifyResponse = await axios.post('/user/payment/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        if (verifyResponse.data.success) {
                            window.location.href = `/user/order/confirmation/${verifyResponse.data.orderId}`;
                        } else {
                            throw new Error(verifyResponse.data.message || 'Payment verification failed');
                        }
                    } catch (error) {
                        if (handlePlacementError(error, 'Payment captured but order could not be placed due to stock issues.')) {
                            restoreBtn();
                            return;
                        }
                        const reason = encodeURIComponent(error.response?.data?.message || error.message || 'Payment verification failed');
                        window.location.href = `/user/payment/failed?reason=${reason}`;
                    }
                },
                prefill: { name: "", email: "", contact: "" },
                theme: { color: "#EAB308" },
                modal: {
                    ondismiss: function () {
                        restoreBtn();
                    }
                }
            };

            const rzp1 = new Razorpay(options);
            rzp1.on('payment.failed', function (response) {
                const reason = encodeURIComponent(response.error.description || 'Payment was declined by the bank');
                window.location.href = `/user/payment/failed?reason=${reason}`;
            });
            rzp1.open();
        } catch (error) {
            if (handlePlacementError(error, 'Could not place order due to stock issues.')) {
                restoreBtn();
                return;
            }
            const reason = encodeURIComponent(error.response?.data?.message || error.message || 'Could not initiate payment');
            window.location.href = `/user/payment/failed?reason=${reason}`;
        }
    });
});
