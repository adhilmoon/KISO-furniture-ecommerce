function openCreateOfferModal() {
  document.getElementById('createOfferModal').classList.replace('hidden', 'flex');
  toggleOfferTargetFields();
}
function closeCreateOfferModal() {
  document.getElementById('createOfferModal').classList.replace('flex', 'hidden');
  document.getElementById('createOfferForm').reset();
}

function toggleOfferTargetFields() {
  const type = document.getElementById('offerType').value;
  const productField = document.getElementById('productField');
  const categoryField = document.getElementById('categoryField');
  if (type === 'product') {
    productField.classList.remove('hidden');
    categoryField.classList.add('hidden');
  } else if (type === 'category') {
    productField.classList.add('hidden');
    categoryField.classList.remove('hidden');
  } else {
    productField.classList.add('hidden');
    categoryField.classList.add('hidden');
  }
}

async function deleteOffer(id) {
  const result = await confirmAction('Delete this offer? Linked product/category will be unlinked.', 'warning');
  if (!result.isConfirmed) return;
  try {
    const res = await axios.delete('/admin/offers/' + id);
    if (res.data.success) {
      showToast(res.data.message, true);
      setTimeout(() => location.reload(), 800);
    }
  } catch (err) {
    showToast(err.response?.data?.message || 'Failed to delete offer', false);
  }
}

async function toggleOffer(id) {
  try {
    const res = await axios.patch('/admin/offers/' + id + '/toggle');
    if (res.data.success) {
      showToast(res.data.message, true);
      setTimeout(() => location.reload(), 800);
    }
  } catch (err) {
    showToast(err.response?.data?.message || 'Failed to toggle offer', false);
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
  const form = document.getElementById('createOfferForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      for (const k of ['maxDiscount', 'description', 'productId', 'categoryId']) {
        if (data[k] === '') delete data[k];
      }
      try {
        const res = await axios.post('/admin/offers', data);
        if (res.data.success) {
          showToast(res.data.message, true);
          setTimeout(() => location.reload(), 800);
        }
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to create offer', false);
      }
    });
  }

  const modal = document.getElementById('createOfferModal');
  if (modal) modal.addEventListener('click', function (e) {
    if (e.target === this) closeCreateOfferModal();
  });
});
