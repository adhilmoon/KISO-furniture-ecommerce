function openCreateCouponModal() {
  document.getElementById('createCouponModal').classList.replace('hidden', 'flex');
}
function closeCreateCouponModal() {
  document.getElementById('createCouponModal').classList.replace('flex', 'hidden');
  document.getElementById('createCouponForm').reset();
}

async function deleteCoupon(id) {
  if (!confirm('Delete this coupon? Action cannot be undone.')) return;
  try {
    const res = await axios.delete('/admin/coupons/' + id);
    if (res.data.success) {
      showToast(res.data.message, true);
      setTimeout(() => location.reload(), 800);
    }
  } catch (err) {
    showToast(err.response?.data?.message || 'Failed to delete coupon', false);
  }
}

async function toggleCoupon(id) {
  try {
    const res = await axios.patch('/admin/coupons/' + id + '/toggle');
    if (res.data.success) {
      showToast(res.data.message, true);
      setTimeout(() => location.reload(), 800);
    }
  } catch (err) {
    showToast(err.response?.data?.message || 'Failed to toggle coupon', false);
  }
}

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

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('createCouponForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      for (const k of ['minPurchase', 'maxDiscount', 'usageLimit', 'perUserLimit', 'description']) {
        if (data[k] === '') delete data[k];
      }
      try {
        const res = await axios.post('/admin/coupons', data);
        if (res.data.success) {
          showToast(res.data.message, true);
          setTimeout(() => location.reload(), 800);
        }
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to create coupon', false);
      }
    });
  }

  const modal = document.getElementById('createCouponModal');
  if (modal) modal.addEventListener('click', function (e) {
    if (e.target === this) closeCreateCouponModal();
  });
});
