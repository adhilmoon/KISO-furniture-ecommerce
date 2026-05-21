const modal = document.getElementById('roomModal');
const form = document.getElementById('roomForm');
const modalTitle = document.getElementById('roomModalTitle');
const submitBtn = document.getElementById('roomSubmitBtn');
const imageRequiredMark = document.getElementById('roomImageRequired');

const fields = {
    id: document.getElementById('roomId'),
    title: document.getElementById('roomTitle'),
    linkUrl: document.getElementById('roomLink'),
    order: document.getElementById('roomOrder'),
    isActive: document.getElementById('roomActive'),
    image: document.getElementById('roomImage')
};

const preview = {
    img: document.getElementById('roomPreviewImg'),
    title: document.getElementById('roomPreviewTitle')
};

function showToast(message, success) {
    const t = document.createElement('div');
    t.className = 'fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl border text-sm font-semibold ' +
        (success
            ? 'bg-green-500/10 text-green-400 border-green-500/20'
            : 'bg-red-500/10 text-red-400 border-red-500/20');
    t.textContent = message;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

function renderPreview() {
    preview.title.textContent = fields.title.value || 'Room title';
}

function resetForm() {
    form.reset();
    fields.id.value = '';
    fields.order.value = 0;
    fields.isActive.checked = true;
    preview.img.removeAttribute('src');
    renderPreview();
}

function openRoomModal(room) {
    resetForm();
    if (room && room._id) {
        modalTitle.textContent = 'Edit Room';
        submitBtn.textContent = 'Update Room';
        imageRequiredMark.style.display = 'none';
        fields.id.value = room._id;
        fields.title.value = room.title || '';
        fields.linkUrl.value = room.linkUrl || '';
        fields.order.value = room.order ?? 0;
        fields.isActive.checked = !!room.isActive;
        if (room.image?.url) preview.img.src = room.image.url;
    } else {
        modalTitle.textContent = 'Create Room';
        submitBtn.textContent = 'Save Room';
        imageRequiredMark.style.display = 'inline';
    }
    renderPreview();
    modal.classList.replace('hidden', 'flex');
}

function closeRoomModal() {
    modal.classList.replace('flex', 'hidden');
    resetForm();
}

async function deleteRoom(id) {
    if (!confirm('Delete this room? Action cannot be undone.')) return;
    try {
        const res = await axios.delete('/admin/rooms/' + id);
        if (res.data.success) {
            showToast(res.data.message, true);
            setTimeout(() => location.reload(), 600);
        }
    } catch (err) {
        showToast(err.response?.data?.message || 'Failed to delete room', false);
    }
}

async function toggleRoom(id) {
    try {
        const res = await axios.patch('/admin/rooms/' + id + '/toggle');
        if (res.data.success) {
            showToast(res.data.message, true);
            setTimeout(() => location.reload(), 600);
        }
    } catch (err) {
        showToast(err.response?.data?.message || 'Failed to toggle room', false);
    }
}

async function saveRoomOrder(id) {
    const input = document.querySelector(`[data-order="${id}"]`);
    const order = parseInt(input?.value, 10);
    if (!Number.isInteger(order) || order < 0) {
        return showToast('Order must be a non-negative integer', false);
    }
    try {
        const res = await axios.patch('/admin/rooms/reorder', { items: [{ id, order }] });
        if (res.data.success) {
            showToast(res.data.message, true);
            setTimeout(() => location.reload(), 600);
        }
    } catch (err) {
        showToast(err.response?.data?.message || 'Failed to save order', false);
    }
}

form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = fields.id.value;
    const fd = new FormData();
    fd.append('title', fields.title.value.trim());
    fd.append('linkUrl', fields.linkUrl.value.trim());
    fd.append('order', fields.order.value || '0');
    fd.append('isActive', fields.isActive.checked ? 'true' : 'false');
    if (fields.image.files[0]) fd.append('image', fields.image.files[0]);

    const url = id ? '/admin/rooms/' + id : '/admin/rooms';
    try {
        const res = await axios.post(url, fd);
        if (res.data.success) {
            showToast(res.data.message, true);
            setTimeout(() => location.reload(), 600);
        }
    } catch (err) {
        showToast(err.response?.data?.message || 'Failed to save room', false);
    }
});

['input', 'change'].forEach(ev => {
    fields.title?.addEventListener(ev, renderPreview);
});

fields.image?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { preview.img.src = ev.target.result; };
    reader.readAsDataURL(file);
});

modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeRoomModal();
});
