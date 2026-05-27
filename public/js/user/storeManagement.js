
const $ = id => document.getElementById(id);


function getActiveParams() {
  const search   = $('searchInput')?.value.trim()  || '';
  const category = document.querySelector('input[name="categoryFilter"]:checked')?.value || '';
  const minPrice = $('minPrice')?.value.trim()     || '';
  const maxPrice = $('maxPrice')?.value.trim()     || '';
  const sort     = $('sortSelect')?.value          || 'newest';
  return { search, category, minPrice, maxPrice, sort };
}


function buildQtyControlHTML(itemId, qty) {
  return `<div class="flex items-center justify-between bg-brand-bg1 rounded-lg overflow-hidden border border-brand-accent/40">
    <button onclick="decrementStore('${itemId}', this)" class="px-4 py-3 text-brand-accent hover:bg-brand-accent/10 font-bold text-xl transition-colors leading-none">−</button>
    <span class="qty-display text-brand-light font-semibold">${qty}</span>
    <button onclick="incrementStore('${itemId}', this)" class="px-4 py-3 text-brand-accent hover:bg-brand-accent/10 font-bold text-xl transition-colors leading-none">+</button>
  </div>`;
}

function buildAddToCartHTML(productId, variantIndex) {
  return `<button onclick="addToCartFromStore('${productId}', ${variantIndex}, this)"
    class="w-full px-4 py-3 bg-brand-accent hover:bg-yellow-600 text-brand-bg1 font-semibold rounded-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
    </svg>
    Add to Cart
  </button>`;
}

async function addToCartFromStore(productId, variantIndex, btn) {
  try {
    const response = await axios.post('/user/cart/add', { productId, variantIndex, quantity: 1 });
    if (response.data.success) {
      const cart = response.data.cart;
      const item = cart.items.find(i => {
        const pid = String(i.productId?._id || i.productId);
        return pid === String(productId) && i.variantIndex == variantIndex;
      });
      if (item) {
        const area = btn.closest('.cart-action-area');
        area.innerHTML = buildQtyControlHTML(item._id, item.quantity);
      }
      if (window.refreshNavBadges) window.refreshNavBadges();
      showToast('Product added to cart!', 'success');
    } else {
      showToast(response.data.message || 'Error adding to cart', 'error');
    }
  } catch (error) {
    if (error.response?.status === 401) {
      window.location.href = '/user/login';
    } else {
      showToast(error.response?.data?.message || 'Something went wrong', 'error');
    }
  }
}

async function incrementStore(itemId, btn) {
  const area = btn.closest('.cart-action-area');
  const qtyEl = area.querySelector('.qty-display');
  const currentQty = parseInt(qtyEl.textContent);
  try {
    const res = await axios.patch(`/user/cart/item/${itemId}`, { quantity: currentQty + 1 });
    if (res.data.success) {
      qtyEl.textContent = currentQty + 1;
    }
  } catch (err) {
    showToast(err.response?.data?.message || 'Error updating cart', 'error');
  }
}

async function decrementStore(itemId, btn) {
  const area = btn.closest('.cart-action-area');
  const qtyEl = area.querySelector('.qty-display');
  const currentQty = parseInt(qtyEl.textContent);
  const productId = area.dataset.productId;
  const variantIndex = parseInt(area.dataset.variantIndex);

  if (currentQty <= 1) {
    try {
      await axios.delete(`/user/cart/item/${itemId}`);
      area.innerHTML = buildAddToCartHTML(productId, variantIndex);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error removing item', 'error');
    }
  } else {
    try {
      const res = await axios.patch(`/user/cart/item/${itemId}`, { quantity: currentQty - 1 });
      if (res.data.success) {
        qtyEl.textContent = currentQty - 1;
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error updating cart', 'error');
    }
  }
}

async function toggleWishlist(productId) {
  try {
    const response = await axios.post('/user/wishlist/toggle', { productId });
    if (response.data.success) {
      if (window.refreshNavBadges) window.refreshNavBadges();
      showToast(response.data.message, 'success');
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      window.location.href = '/user/login';
    } else {
      showToast(error.response?.data?.message || 'Error updating wishlist', 'error');
    }
  }
}


function buildQueryString(params, page = 1) {
  const p = new URLSearchParams();
  if (page > 1)          p.set('page',     page);
  if (params.search)     p.set('search',   params.search);
  if (params.category)   p.set('category', params.category);
  if (params.minPrice)   p.set('minPrice', params.minPrice);
  if (params.maxPrice)   p.set('maxPrice', params.maxPrice);
  if (params.sort && params.sort !== 'newest') p.set('sort', params.sort);
  return p.toString() ? '?' + p.toString() : '';
}


function applySort() {
  applyFilters();
}


function applyFilters() {
  const params = getActiveParams();
  const qs = buildQueryString(params, 1);
  window.location.href = '/user/store' + qs;
}

function clearFilters() {
  window.location.href = '/user/store';
}

function removeCategoryFilter() {
  const params = getActiveParams();
  params.category = '';
  window.location.href = '/user/store' + buildQueryString(params, 1);
}
function removePriceFilter() {
  const params = getActiveParams();
  params.minPrice = '';
  params.maxPrice = '';
  window.location.href = '/user/store' + buildQueryString(params, 1);
}


function setPricePreset(min, max) {
  const minEl = $('minPrice');
  const maxEl = $('maxPrice');
  if (minEl) minEl.value = min > 0 ? min : '';
  if (maxEl) maxEl.value = max > 0 ? max : '';
}


let searchTimeout;
function handleSearchDebounced() {
  const clearBtn = $('clearSearchBtn');
  const input    = $('searchInput');
  if (input && clearBtn) {
    clearBtn.classList.toggle('hidden', input.value.trim() === '');
  }
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const params = getActiveParams();
    const qs = buildQueryString(params, 1);
    window.location.href = '/user/store' + qs;
  },600);
}

function clearSearch() {
  const input    = $('searchInput');
  const clearBtn = $('clearSearchBtn');
  if (input)    input.value = '';
  if (clearBtn) clearBtn.classList.add('hidden');
  const params = getActiveParams();
  params.search = '';
  window.location.href = '/user/store' + buildQueryString(params, 1);
}


function toggleFilter(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('hidden');
}

// ── Dual Range Slider Logic ──────────────────────────────────────────
function updatePriceSlider() {
  const minSlider = document.getElementById('minPriceSlider');
  const maxSlider = document.getElementById('maxPriceSlider');
  const minDisplay = document.getElementById('minPriceDisplay');
  const maxDisplay = document.getElementById('maxPriceDisplay');
  const track = document.getElementById('sliderTrack');
  const hiddenMin = document.getElementById('minPrice');
  const hiddenMax = document.getElementById('maxPrice');

  if (!minSlider || !maxSlider) return;

  let minVal = parseInt(minSlider.value);
  let maxVal = parseInt(maxSlider.value);
  
  const absMin = parseInt(minSlider.min);
  const absMax = parseInt(maxSlider.max);
  const range = absMax - absMin;

  // Prevent crossing thumbs (gap of 100)
  if (minVal >= maxVal - 100) {
    if (this.id === 'minPriceSlider') {
      minSlider.value = maxVal - 100;
      minVal = parseInt(minSlider.value);
    } else {
      maxSlider.value = minVal + 100;
      maxVal = parseInt(maxSlider.value);
    }
  }

  // Update visual track (relative to dynamic min/max)
  const minPercent = range > 0 ? ((minVal - absMin) / range) * 100 : 0;
  const maxPercent = range > 0 ? ((maxVal - absMin) / range) * 100 : 100;
  
  if (track) {
    track.style.left = minPercent + '%';
    track.style.right = (100 - maxPercent) + '%';
  }

  // Update display text
  if (minDisplay) minDisplay.textContent = '₹' + minVal.toLocaleString();
  if (maxDisplay) maxDisplay.textContent = maxVal >= absMax ? '₹' + maxVal.toLocaleString() + '+' : '₹' + maxVal.toLocaleString();

  // Update hidden inputs for getActiveParams
  if (hiddenMin) hiddenMin.value = minVal > absMin ? minVal : '';
  if (hiddenMax) hiddenMax.value = maxVal >= absMax ? '' : maxVal;
}

// Initialize slider on load
document.addEventListener("DOMContentLoaded", () => {
  updatePriceSlider();
});
