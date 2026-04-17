let qty = 1;

function changeQty(delta) {
  qty = Math.max(1, Math.min(10, qty + delta));
  document.getElementById('qtyDisplay').textContent = qty;
}

function switchImage(src, btn) {
  document.getElementById('mainImage').src = src;
  document.querySelectorAll('.thumb-btn').forEach(b => {
    b.classList.remove('border-brand-accent');
    b.classList.add('border-white/10');
  });
  btn.classList.add('border-brand-accent');
  btn.classList.remove('border-white/10');
}

function selectVariant(btn, name, price) {
  document.querySelectorAll('#variantGroup .variant-btn').forEach(b => {
    b.classList.remove('border-brand-accent');
    b.classList.add('border-white/10');
  });
  btn.classList.add('border-brand-accent');
  btn.classList.remove('border-white/10');
  document.getElementById('selectedVariant').textContent = name;
}

function selectOpt(btn, groupId, labelId, name) {
  document.querySelectorAll(`#${groupId} button`).forEach(b => {
    b.classList.remove('border-brand-accent', 'text-brand-light', 'bg-brand-accent/8');
    b.classList.add('border-white/10', 'text-brand-muted');
  });
  btn.classList.add('border-brand-accent', 'text-brand-light', 'bg-brand-accent/8');
  btn.classList.remove('border-white/10', 'text-brand-muted');
  document.getElementById(labelId).textContent = name;
}

function showTab(name) {
  ['desc', 'specs', 'reviews'].forEach(t => {
    const el = document.getElementById('tab-' + t);
    if(el) el.classList.add('hidden');
  });
  const active = document.getElementById('tab-' + name);
  if(active) active.classList.remove('hidden');

  document.querySelectorAll('.tab-btn').forEach(b => {
    const isActive = b.dataset.tab === name;
    b.classList.toggle('text-brand-accent', isActive);
    b.classList.toggle('border-brand-accent', isActive);
    b.classList.toggle('text-brand-muted', !isActive);
    b.classList.toggle('border-transparent', !isActive);
  });
}

async function addToCart(productId) {
  try {
    const response = await axios.post('/user/cart/add', {productId, quantity: qty});
    if(response.data.success) {
      showToast(response.data.message || 'Added to cart!', 'success');
    }
  } catch(err) {
    showToast(err.response?.data?.message || 'Failed to add to cart', 'error');
  }
}

async function buyNow(productId) {
  try {
    await axios.post('/user/cart/add', {productId, quantity: qty});
    window.location.href = '/user/checkout';
  } catch(err) {
    showToast('Something went wrong', 'error');
  }
}

async function toggleWishlist(productId) {
  try {
    const response = await axios.post('/user/wishlist/toggle', {productId});
    const btn = document.getElementById('wishlistBtn');
    if(response.data.wishlisted) {
      btn.querySelector('svg').setAttribute('fill', 'currentColor');
      btn.classList.add('text-red-400');
      showToast('Added to wishlist', 'success');
    } else {
      btn.querySelector('svg').setAttribute('fill', 'none');
      btn.classList.remove('text-red-400');
      showToast('Removed from wishlist', 'info');
    }
  } catch(err) {
    showToast('Please login first', 'error');
  }
}



document.getElementById('add-to-cart-btn')?.addEventListener('click', async function () {
  if(this.disabled) return;

  let currentVariantIndex = 0;
  document.querySelectorAll('.variant-btn').forEach((btn, index) => {
    if(btn.classList.contains('border-brand-accent')) {
      currentVariantIndex = index;
    }
  });

  const productId = this.dataset.productId;
  const qtyDisplay = document.getElementById('qtyDisplay');
  const qty = parseInt(qtyDisplay ? qtyDisplay.innerText : 1);

  const originalText = this.innerHTML;
  this.innerHTML = 'Adding...';
  this.disabled = true;

  try {
    const response = await axios.post('/user/cart/add', {
      productId,
      variantIndex: currentVariantIndex,
      quantity: qty
    });

    if(response.data.success) {
      showToast('Added to cart!', 'success');
    } else {
      showToast(response.data.message || 'Error adding to cart', 'error');
    }
  } catch(error) {
    if(error.response && error.response.status === 401) {
      window.location.href = '/user/login';
    } else {
      showToast('An error occurred. Make sure you are logged in.', 'error');
    }
  } finally {
    this.innerHTML = originalText;
    this.disabled = false;
  }
});

function toggleWishlist(id) {
  showToast('Wishlist feature coming soon!', 'info');
}
document.addEventListener("DOMContentLoaded", () => {
  const img = document.getElementById("mainImage");

  if (!img) return;

  img.addEventListener("mousemove", (e) => {
    const rect = img.getBoundingClientRect();

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    img.style.transformOrigin = `${x}% ${y}%`;
    img.style.transform = "scale(2)";
  });

  img.addEventListener("mouseleave", () => {
    img.style.transform = "scale(1)";
  });
});