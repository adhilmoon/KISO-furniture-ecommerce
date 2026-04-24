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

function selectVariant(btn, price, imageUrl, variantIndex) {

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
      showToast(error.response?.data?.message || 'An error occurred. Make sure you are logged in.', 'error');
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
function showTab(tabId, btn) {
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  
  // Show selected tab content
  const selectedTab = document.getElementById(tabId + 'Tab');
  if (selectedTab) selectedTab.classList.remove('hidden');

  // Update button styling
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('text-brand-accent', 'border-brand-accent');
    b.classList.add('text-brand-muted', 'border-transparent');
  });

  btn.classList.add('text-brand-accent', 'border-brand-accent');
  btn.classList.remove('text-brand-muted', 'border-transparent');
}
