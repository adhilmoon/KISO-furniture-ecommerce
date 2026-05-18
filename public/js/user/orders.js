

const STATUS_COLORS = {
    pending:          'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    confirmed:        'bg-blue-500/10 text-blue-400 border-blue-500/20',
    processing:       'bg-blue-500/10 text-blue-400 border-blue-500/20',
    shipped:          'bg-purple-500/10 text-purple-400 border-purple-500/20',
    delivered:        'bg-green-500/10 text-green-400 border-green-500/20',
    cancelled:        'bg-red-500/10 text-red-400 border-red-500/20',
    return_requested: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    return_rejected:  'bg-red-500/10 text-red-400 border-red-500/20',
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
    return_rejected:  'Return Rejected',
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
const IMAGE_REQUIRED_REASONS = ['damaged', 'wrong_item', 'defective'];
const IMAGE_OPTIONAL_REASONS = ['not_satisfied', 'other'];

function openReturnModal() {
    document.getElementById('returnModal').classList.replace('hidden', 'flex');
}
function closeReturnModal() {
    document.getElementById('returnModal').classList.replace('flex', 'hidden');
    document.getElementById('returnReason').value = '';
    document.getElementById('returnImage').value = '';
    document.getElementById('returnReasonError').classList.add('hidden');
    document.getElementById('returnImageError').classList.add('hidden');
    document.getElementById('returnImageTypeError').classList.add('hidden');
    document.getElementById('returnImagePreviewName').classList.add('hidden');
    document.getElementById('returnImageSection').classList.add('hidden');
}

function handleReturnReasonChange(value) {
    const section = document.getElementById('returnImageSection');
    const required = document.getElementById('returnImageRequired');
    const optional = document.getElementById('returnImageOptional');
    if (!value) { section.classList.add('hidden'); return; }
    section.classList.remove('hidden');
    if (IMAGE_REQUIRED_REASONS.includes(value)) {
        required.classList.remove('hidden');
        optional.classList.add('hidden');
    } else {
        required.classList.add('hidden');
        optional.classList.remove('hidden');
    }
}

function handleReturnImageChange(input) {
    const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const typeErr = document.getElementById('returnImageTypeError');
    const preview = document.getElementById('returnImagePreviewName');
    typeErr.classList.add('hidden');
    preview.classList.add('hidden');
    if (!input.files[0]) return;
    if (!ALLOWED.includes(input.files[0].type)) {
        typeErr.classList.remove('hidden');
        input.value = '';
        return;
    }
    preview.textContent = input.files[0].name;
    preview.classList.remove('hidden');
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
    const reasonEl = document.getElementById('returnReason');
    const imageEl  = document.getElementById('returnImage');
    const reason   = reasonEl.value;

    document.getElementById('returnReasonError').classList.add('hidden');
    document.getElementById('returnImageError').classList.add('hidden');

    if (!reason) {
        document.getElementById('returnReasonError').classList.remove('hidden');
        return;
    }
    if (IMAGE_REQUIRED_REASONS.includes(reason) && !imageEl.files[0]) {
        document.getElementById('returnImageError').classList.remove('hidden');
        return;
    }

    const formData = new FormData();
    formData.append('reason', reason);
    if (imageEl.files[0]) formData.append('returnImage', imageEl.files[0]);

    try {
        const res = await axios.post(`/user/orders/${ORDER_ID}/return`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
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

async function cancelReturnRequest() {
    const result = await confirmAction('Cancel return request? You will need to submit again if you change your mind.')
     if(!result.isConfirmed) return;
    try {
        const res = await axios.post(`/user/orders/${ORDER_ID}/return/cancel`);
        if (res.data.success) {
            showToast(res.data.message, 'success');
            setTimeout(() => location.reload(), 1200);
        }
    } catch (err) {
        showToast(err.response?.data?.message || 'Error', 'error');
    }
}
