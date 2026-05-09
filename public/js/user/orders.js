const STATUS_COLORS = {
    pending:          'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    confirmed:        'bg-blue-500/10 text-blue-400 border-blue-500/20',
    processing:       'bg-blue-500/10 text-blue-400 border-blue-500/20',
    shipped:          'bg-purple-500/10 text-purple-400 border-purple-500/20',
    delivered:        'bg-green-500/10 text-green-400 border-green-500/20',
    cancelled:        'bg-red-500/10 text-red-400 border-red-500/20',
    return_requested: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    returned:         'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

const STATUS_LABELS = {
    pending:          'Pending',
    confirmed:        'Confirmed',
    processing:       'Processing',
    shipped:          'Shipped',
    delivered:        'Delivered',
    cancelled:        'Cancelled',
    return_requested: 'Return Requested',
    returned:         'Returned',
};

function getStatusColor(status) {
    return STATUS_COLORS[status] || STATUS_COLORS.pending;
}

function getStatusLabel(status) {
    return STATUS_LABELS[status] || status;
}

function formatOrderId(order) {
    return order.orderId || ('#' + order._id.toString().slice(-8).toUpperCase());
}

// --- order-detail modal logic ---

function openCancelOrderModal() {
    document.getElementById('cancelOrderModal').classList.replace('hidden', 'flex');
}
function closeCancelOrderModal() {
    document.getElementById('cancelOrderModal').classList.replace('flex', 'hidden');
    document.getElementById('cancelOrderReason').value = '';
}
function openCancelItemModal(itemId) {
    document.getElementById('cancelItemId').value = itemId;
    document.getElementById('cancelItemModal').classList.replace('hidden', 'flex');
}
function closeCancelItemModal() {
    document.getElementById('cancelItemModal').classList.replace('flex', 'hidden');
    document.getElementById('cancelItemReason').value = '';
}
function openReturnModal() {
    document.getElementById('returnModal').classList.replace('hidden', 'flex');
}
function closeReturnModal() {
    document.getElementById('returnModal').classList.replace('flex', 'hidden');
    document.getElementById('returnReason').value = '';
    document.getElementById('returnReasonError').classList.add('hidden');
}

async function submitCancelOrder() {
    const reason = document.getElementById('cancelOrderReason').value.trim();
    try {
        const res = await axios.post(`/user/orders/${ORDER_ID}/cancel`, { reason });
        if (res.data.success) {
            showToast(res.data.message, 'success');
            setTimeout(() => window.location.reload(), 1200);
        }
    } catch (err) {
        showToast(err.response?.data?.message || 'Error cancelling order', 'error');
    }
    closeCancelOrderModal();
}

async function submitCancelItem() {
    const itemId = document.getElementById('cancelItemId').value;
    const reason = document.getElementById('cancelItemReason').value.trim();
    try {
        const res = await axios.post(`/user/orders/${ORDER_ID}/items/${itemId}/cancel`, { reason });
        if (res.data.success) {
            showToast(res.data.message, 'success');
            setTimeout(() => window.location.reload(), 1200);
        }
    } catch (err) {
        showToast(err.response?.data?.message || 'Error cancelling item', 'error');
    }
    closeCancelItemModal();
}

async function submitReturn() {
    const reason = document.getElementById('returnReason').value.trim();
    if (!reason) {
        document.getElementById('returnReasonError').classList.remove('hidden');
        return;
    }
    document.getElementById('returnReasonError').classList.add('hidden');
    try {
        const res = await axios.post(`/user/orders/${ORDER_ID}/return`, { reason });
        if (res.data.success) {
            showToast(res.data.message, 'success');
            setTimeout(() => window.location.reload(), 1200);
        }
    } catch (err) {
        showToast(err.response?.data?.message || 'Error submitting return', 'error');
    }
    closeReturnModal();
}

document.addEventListener('DOMContentLoaded', () => {
    ['cancelOrderModal', 'cancelItemModal', 'returnModal'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('click', function(e) {
            if (e.target === this) this.classList.replace('flex', 'hidden');
        });
    });
});
