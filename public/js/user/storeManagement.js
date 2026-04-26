
const $ = id => document.getElementById(id);


function getActiveParams() {
  const search   = $('searchInput')?.value.trim()  || '';
  const category = document.querySelector('input[name="categoryFilter"]:checked')?.value || '';
  const minPrice = $('minPrice')?.value.trim()     || '';
  const maxPrice = $('maxPrice')?.value.trim()     || '';
  return { search, category, minPrice, maxPrice };
}


async function addToCartFromStore(productId) {
  try {
    const response = await axios.post('/user/cart/add', {
      productId,
      variantIndex: 0,
      quantity: 1
    });

    if (response.data.success) {
      showToast('Product added to cart!', 'success');
    } else {
      showToast(response.data.message || 'Error adding to cart', 'error');
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      window.location.href = '/user/login';
    } else {
      console.error(error);
      const message=error.response?.data?.message||"something went rowng"
      showToast(message,"error");
    }
  }
}

function toggleWishlist(productId) {
  showToast('Wishlist feature coming soon!', 'info');
}


function buildQueryString(params, page = 1) {
  const p = new URLSearchParams();
  if (page > 1)          p.set('page',     page);
  if (params.search)     p.set('search',   params.search);
  if (params.category)   p.set('category', params.category);
  if (params.minPrice)   p.set('minPrice', params.minPrice);
  if (params.maxPrice)   p.set('maxPrice', params.maxPrice);
  return p.toString() ? '?' + p.toString() : '';
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


document.addEventListener('DOMContentLoaded', () => {
  
});