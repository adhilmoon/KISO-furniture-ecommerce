
const $ = id => document.getElementById(id);

// ─────────────────────────────────────────────────────────────────
// Collect current filter values from the sidebar
// ─────────────────────────────────────────────────────────────────
function getActiveParams() {
  const search   = $('searchInput')?.value.trim()  || '';
  const category = document.querySelector('input[name="categoryFilter"]:checked')?.value || '';
  const minPrice = $('minPrice')?.value.trim()     || '';
  const maxPrice = $('maxPrice')?.value.trim()     || '';
  const sort     = $('sortSelect')?.value          || 'newest';
  return { search, category, minPrice, maxPrice, sort };
}

// ─────────────────────────────────────────────────────────────────
// Add to Cart from Store Page
// ─────────────────────────────────────────────────────────────────
async function addToCartFromStore(productId) {
  try {
    const response = await axios.post('/user/cart/add', {
      productId,
      variantIndex: 0,
      quantity: 1
    });

    if (response.data.success) {
      alert('Product added to cart!');
    } else {
      alert(response.data.message || 'Error adding to cart');
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      window.location.href = '/user/login';
    } else {
      console.error(error);
      alert('Failed to add product to cart. Please make sure you are logged in.');
    }
  }
}

function toggleWishlist(productId) {
  alert('Wishlist feature coming soon!');
}

// ─────────────────────────────────────────────────────────────────
// Build a URL query-string from params
// ─────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────
// Apply filters → navigate (full-page reload so pagination, chips,
// and sidebar state all reflect the new query cleanly)
// ─────────────────────────────────────────────────────────────────
function applyFilters() {
  const params = getActiveParams();
  const qs = buildQueryString(params, 1);
  window.location.href = '/user/store' + qs;
}

// Sort shortcut — fire immediately on change
function applySort() {
  const params = getActiveParams();
  const qs = buildQueryString(params, 1);
  window.location.href = '/user/store' + qs;
}

// ─────────────────────────────────────────────────────────────────
// Clear all filters
// ─────────────────────────────────────────────────────────────────
function clearFilters() {
  window.location.href = '/user/store';
}

// ─────────────────────────────────────────────────────────────────
// Individual chip remove helpers
// ─────────────────────────────────────────────────────────────────
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
function removeSortFilter() {
  const params = getActiveParams();
  params.sort = 'newest';
  window.location.href = '/user/store' + buildQueryString(params, 1);
}

// ─────────────────────────────────────────────────────────────────
// Price preset buttons
// ─────────────────────────────────────────────────────────────────
function setPricePreset(min, max) {
  const minEl = $('minPrice');
  const maxEl = $('maxPrice');
  if (minEl) minEl.value = min > 0 ? min : '';
  if (maxEl) maxEl.value = max > 0 ? max : '';
}

// ─────────────────────────────────────────────────────────────────
// Search — debounced, navigates on change
// ─────────────────────────────────────────────────────────────────
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
  }, 500);
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

// ─────────────────────────────────────────────────────────────────
// Filter accordion toggle
// ─────────────────────────────────────────────────────────────────
function toggleFilter(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('hidden');
}

// ─────────────────────────────────────────────────────────────────
// Sort select — fire immediately
// ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  $('sortSelect')?.addEventListener('change', applySort);
});