const modal = document.getElementById('bannerModal');
const form = document.getElementById('bannerForm');
const modalTitle = document.getElementById('bannerModalTitle');
const submitBtn = document.getElementById('bannerSubmitBtn');
const imageRequiredMark = document.getElementById('bannerImageRequired');

const fields = {
    id: document.getElementById('bannerId'),
    title: document.getElementById('bannerTitle'),
    subtitle: document.getElementById('bannerSubtitle'),
    ctaText: document.getElementById('bannerCta'),
    linkUrl: document.getElementById('bannerLink'),
    bgColor: document.getElementById('bannerBg'),
    textColor: document.getElementById('bannerText'),
    order: document.getElementById('bannerOrder'),
    isActive: document.getElementById('bannerActive'),
    image: document.getElementById('bannerImage')
};

const preview = {
    box: document.getElementById('bannerPreview'),
    img: document.getElementById('bannerPreviewImg'),
    title: document.getElementById('bannerPreviewTitle'),
    subtitle: document.getElementById('bannerPreviewSubtitle'),
    cta: document.getElementById('bannerPreviewCta')
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
    preview.box.style.background = fields.bgColor.value;
    preview.box.style.color = fields.textColor.value;
    preview.title.textContent = fields.title.value || 'Your headline';
    preview.subtitle.textContent = fields.subtitle.value || 'Short supporting subtitle';
    preview.cta.textContent = fields.ctaText.value || '';
    preview.cta.style.display = fields.ctaText.value ? 'inline-block' : 'none';
}

function resetForm() {
    form.reset();
    fields.id.value = '';
    fields.bgColor.value = '#1a1a1a';
    fields.textColor.value = '#ffffff';
    fields.order.value = 0;
    fields.isActive.checked = true;
    preview.img.removeAttribute('src');
    renderPreview();
}

function openBannerModal(banner) {
    resetForm();
    if (banner && banner._id) {
        modalTitle.textContent = 'Edit Banner';
        submitBtn.textContent = 'Update Banner';
        imageRequiredMark.style.display = 'none';
        fields.id.value = banner._id;
        fields.title.value = banner.title || '';
        fields.subtitle.value = banner.subtitle || '';
        fields.ctaText.value = banner.ctaText || '';
        fields.linkUrl.value = banner.linkUrl || '';
        fields.bgColor.value = banner.bgColor || '#1a1a1a';
        fields.textColor.value = banner.textColor || '#ffffff';
        fields.order.value = banner.order ?? 0;
        fields.isActive.checked = !!banner.isActive;
        if (banner.image?.url) preview.img.src = banner.image.url;
    } else {
        modalTitle.textContent = 'Create Banner';
        submitBtn.textContent = 'Save Banner';
        imageRequiredMark.style.display = 'inline';
    }
    renderPreview();
    modal.classList.replace('hidden', 'flex');
}

function closeBannerModal() {
    modal.classList.replace('flex', 'hidden');
    resetForm();
}

async function deleteBanner(id) {
    const result = await confirmAction('Delete this banner? Action cannot be undone.', 'warning');
    if (!result.isConfirmed) return;
    try {
        const res = await axios.delete('/admin/banners/' + id);
        if (res.data.success) {
            showToast(res.data.message, true);
            setTimeout(() => location.reload(), 600);
        }
    } catch (err) {
        showToast(err.response?.data?.message || 'Failed to delete banner', false);
    }
}

async function toggleBanner(id) {
    try {
        const res = await axios.patch('/admin/banners/' + id + '/toggle');
        if (res.data.success) {
            showToast(res.data.message, true);
            setTimeout(() => location.reload(), 600);
        }
    } catch (err) {
        showToast(err.response?.data?.message || 'Failed to toggle banner', false);
    }
}

async function saveOrder(id) {
    const input = document.querySelector(`[data-order="${id}"]`);
    const order = parseInt(input?.value, 10);
    if (!Number.isInteger(order) || order < 0) {
        return showToast('Order must be a non-negative integer', false);
    }
    try {
        const res = await axios.patch('/admin/banners/reorder', { items: [{ id, order }] });
        if (res.data.success) {
            showToast(res.data.message, true);
            setTimeout(() => location.reload(), 600);
        }
    } catch (err) {
        showToast(err.response?.data?.message || 'Failed to save order', false);
    }
}

// Form submit (create or update)
form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = fields.id.value;
    const fd = new FormData();
    fd.append('title', fields.title.value.trim());
    fd.append('subtitle', fields.subtitle.value.trim());
    fd.append('ctaText', fields.ctaText.value.trim());
    fd.append('linkUrl', fields.linkUrl.value.trim());
    fd.append('bgColor', fields.bgColor.value);
    fd.append('textColor', fields.textColor.value);
    fd.append('order', fields.order.value || '0');
    fd.append('isActive', fields.isActive.checked ? 'true' : 'false');
    if (fields.image.files[0]) fd.append('image', fields.image.files[0]);

    const url = id ? '/admin/banners/' + id : '/admin/banners';
    try {
        const res = await axios.post(url, fd);
        if (res.data.success) {
            showToast(res.data.message, true);
            setTimeout(() => location.reload(), 600);
        }
    } catch (err) {
        showToast(err.response?.data?.message || 'Failed to save banner', false);
    }
});

// Live preview wiring
['input', 'change'].forEach(ev => {
    [fields.title, fields.subtitle, fields.ctaText, fields.bgColor, fields.textColor]
        .forEach(el => el?.addEventListener(ev, renderPreview));
});

fields.image?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { preview.img.src = ev.target.result; };
    reader.readAsDataURL(file);
});

modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeBannerModal();
});
