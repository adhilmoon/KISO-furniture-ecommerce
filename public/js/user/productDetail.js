let qty = 1;
const MAX_PER_USER = 3;

function changeQty(delta) {
  const activeVariant = document.querySelector('.variant-btn.border-brand-accent');
  const maxStock = activeVariant ? parseInt(activeVariant.dataset.stock) : 10;
  
  const potentialQty = qty + delta;

  if (potentialQty < 1) return;
  
  if (potentialQty > MAX_PER_USER) {
    showToast(`Maximum ${MAX_PER_USER} units allowed per user`, 'warning');
    return;
  }
  
  if (potentialQty > maxStock) {
    showToast('Maximum available stock reached', 'warning');
    return;
  }

  qty = potentialQty;
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

function updateStockUI(stock) {
  const stockBadge = document.getElementById('stock-status');
  const addToCartBtn = document.getElementById('add-to-cart-btn');
  const buyNowBtn = document.getElementById('buy-now-btn');
  const qtyDisplay = document.getElementById('qtyDisplay');

  if (!stockBadge) return;

  if (stock > 0 && stock <= 5) {
    stockBadge.innerHTML = `● Only ${stock} left`;
    stockBadge.className = 'text-sm px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold rounded-full transition-all duration-300';
  } else if (stock > 5) {
    stockBadge.innerHTML = '● In Stock';
    stockBadge.className = 'text-sm px-4 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 font-bold rounded-full transition-all duration-300';
  }

  if (stock > 0) {
    
    if (addToCartBtn) {
      addToCartBtn.disabled = false;
      addToCartBtn.innerText = 'Add to Cart';
    }
    if (buyNowBtn) buyNowBtn.disabled = false;

 
    if (qty > stock) {
      qty = stock;
      if (qtyDisplay) qtyDisplay.textContent = qty;
    }
  } else {

    stockBadge.innerHTML = '● Out of Stock';
    stockBadge.className = 'text-sm px-4 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded-full transition-all duration-300';
    
    if (addToCartBtn) {
      addToCartBtn.disabled = true;
      addToCartBtn.innerText = 'Out of Stock';
    }
    if (buyNowBtn) buyNowBtn.disabled = true;
  }
}

function selectVariant(btn, price, imageUrl, variantIndex, stock) {
 
  document.querySelectorAll('.variant-btn').forEach(b => {
    b.classList.remove('border-brand-accent');
    b.classList.add('border-white/10');
  });
  btn.classList.add('border-brand-accent');
  btn.classList.remove('border-white/10');

 
  const priceEl = document.getElementById('product-price');
  if (priceEl) priceEl.innerText = '₹' + price;


  const mainImg = document.getElementById('mainImage');
  if (mainImg && imageUrl && imageUrl !== '') {
    mainImg.src = imageUrl;
  }


  updateStockUI(stock);


  document.querySelectorAll('.thumb-btn').forEach(thumb => {
    const thumbVariantIndex = parseInt(thumb.dataset.variantIndex);
    if (thumbVariantIndex === variantIndex) {
      thumb.classList.remove('hidden');
      
      const thumbImg = thumb.querySelector('img');
      if (thumbImg && thumbImg.getAttribute('src') === imageUrl) {
        thumb.classList.add('border-brand-accent');
        thumb.classList.remove('border-white/10');
      } else {
        thumb.classList.remove('border-brand-accent');
        thumb.classList.add('border-white/10');
      }
    } else {
      thumb.classList.add('hidden');
    }
  });
}

async function addToCart(productId) {
  const btn = document.getElementById('add-to-cart-btn');
  if (btn.disabled) return;

  let currentVariantIndex = 0;
  document.querySelectorAll('.variant-btn').forEach((vBtn, index) => {
    if (vBtn.classList.contains('border-brand-accent')) {
      currentVariantIndex = index;
    }
  });

  const qtyDisplay = document.getElementById('qtyDisplay');
  const quantity = parseInt(qtyDisplay ? qtyDisplay.innerText : 1);

  const originalText = btn.innerHTML;
  btn.innerHTML = 'Adding...';
  btn.disabled = true;

  try {
    const response = await axios.post('/user/cart/add', {
      productId,
      variantIndex: currentVariantIndex,
      quantity
    });

    if (response.data.success) {
      showToast('Added to cart!', 'success');
    } else {
      showToast(response.data.message || 'Error adding to cart', 'error');
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      window.location.href = '/user/login';
    } else {
      showToast(error.response?.data?.message || 'An error occurred.', 'error');
    }
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

async function buyNow(productId) {
  let currentVariantIndex = 0;
  document.querySelectorAll('.variant-btn').forEach((vBtn, index) => {
    if (vBtn.classList.contains('border-brand-accent')) {
      currentVariantIndex = index;
    }
  });

  const qtyDisplay = document.getElementById('qtyDisplay');
  const quantity = parseInt(qtyDisplay ? qtyDisplay.innerText : 1);

  try {
    const response = await axios.post('/user/cart/add', {
      productId,
      variantIndex: currentVariantIndex,
      quantity
    });
    
    if (response.data.success) {
      window.location.href = '/user/cart';
    } else {
      showToast(response.data.message || 'Error processing request', 'error');
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      window.location.href = '/user/login';
    } else {
      showToast(error.response?.data?.message || 'Something went wrong', 'error');
    }
  }
}

async function toggleWishlist(productId) {
  try {
    const response = await axios.post('/user/wishlist/toggle', { productId });
    if (response.data.success) {
      showToast(response.data.message, 'success');
      
      // Update UI if button exists
      const btn = document.getElementById('wishlistBtn');
      if (btn) {
        const svg = btn.querySelector('svg');
        if (response.data.action === 'added') {
          btn.classList.add('bg-brand-accent', 'text-brand-bg1', 'opacity-100');
          btn.classList.remove('bg-brand-bg1/80', 'text-brand-muted');
          if (svg) svg.setAttribute('fill', 'currentColor');
        } else {
          btn.classList.remove('bg-brand-accent', 'text-brand-bg1', 'opacity-100');
          btn.classList.add('bg-brand-bg1/80', 'text-brand-muted');
          if (svg) svg.setAttribute('fill', 'none');
        }
      }
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      window.location.href = '/user/login';
    } else {
      showToast(error.response?.data?.message || 'Error updating wishlist', 'error');
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Initial stock check for the first variant
  const activeVariant = document.querySelector('.variant-btn.border-brand-accent');
  if (activeVariant) {
    const initialStock = parseInt(activeVariant.dataset.stock);
    updateStockUI(initialStock);
  }

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

function showTab(tabId, btn) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  const selectedTab = document.getElementById(tabId + 'Tab');
  if (selectedTab) selectedTab.classList.remove('hidden');

  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('text-brand-accent', 'border-brand-accent');
    b.classList.add('text-brand-muted', 'border-transparent');
  });

  btn.classList.add('text-brand-accent', 'border-brand-accent');
  btn.classList.remove('text-brand-muted', 'border-transparent');
}
