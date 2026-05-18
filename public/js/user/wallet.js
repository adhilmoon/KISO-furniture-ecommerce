function openTopupModal() {
    document.getElementById('topupModal').classList.replace('hidden', 'flex');
    resetTopupBtn();
}

function closeTopupModal() {
    document.getElementById('topupModal').classList.replace('flex', 'hidden');
    document.getElementById('topupAmount').value = '';
    resetTopupBtn();
}

function resetTopupBtn() {
    const btn = document.getElementById('topupPayBtn');
    if (btn) { btn.disabled = false; btn.textContent = 'Add Money'; }
}

function setTopupAmount(value) {
    document.getElementById('topupAmount').value = value;
}

async function submitTopup() {
    const input = document.getElementById('topupAmount');
    const btn = document.getElementById('topupPayBtn');
    const amount = parseInt(input.value, 10);

    if (!amount || amount < 1) {
        if (window.showToast) showToast('Enter a valid amount (minimum ₹1)', 'error');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Initializing...';

    try {
        const res = await axios.post('/user/wallet/topup/create-order', { amount });
        if (!res.data.success) throw new Error(res.data.message || 'Failed to initialize top-up');

        const { order, razorpayKeyId } = res.data;
        if (!razorpayKeyId) throw new Error('Razorpay key missing');

        closeTopupModal();

        const options = {
            key: razorpayKeyId,
            amount: order.amount,
            currency: order.currency,
            name: 'KISO Wallet',
            description: 'Wallet Top-Up',
            order_id: order.id,
            handler: async function (response) {
                try {
                    const verifyRes = await axios.post('/user/wallet/topup/verify', {
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature
                    });
                    if (verifyRes.data.success) {
                        if (window.showToast) showToast(verifyRes.data.message, 'success');
                        setTimeout(() => location.reload(), 1000);
                    } else {
                        throw new Error(verifyRes.data.message || 'Verification failed');
                    }
                } catch (err) {
                    if (window.showToast) showToast(err.response?.data?.message || err.message || 'Verification failed', 'error');
                }
            },
            theme: { color: '#EAB308' },
            modal: {
                ondismiss: function () {
                    if (window.showToast) showToast('Top-up cancelled', 'info');
                }
            }
        };

        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function () {
            if (window.showToast) showToast('Payment failed. Please try again.', 'error');
        });
        rzp.open();
    } catch (err) {
        if (window.showToast) showToast(err.response?.data?.message || err.message || 'Top-up failed', 'error');
        resetTopupBtn();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('topupModal');
    if (modal) modal.addEventListener('click', function (e) {
        if (e.target === this) closeTopupModal();
    });
});
