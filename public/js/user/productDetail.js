const $ = id => document.getElementById(id);

let currentVariantIndex = 0;

document.addEventListener('DOMContentLoaded', () => {

    // ── Variant Selection ──────────────────────────────────────────────
    const variantBtns = document.querySelectorAll('.variant-btn');

    variantBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active styling
            variantBtns.forEach(b => {
                b.classList.remove('border-stone-900', 'bg-stone-100', 'text-stone-900', 'shadow-md', 'ring-4', 'ring-stone-900/10');
                b.classList.add('border-stone-200', 'text-stone-500');
            });
            this.classList.remove('border-stone-200', 'text-stone-500');
            this.classList.add('border-stone-900', 'bg-stone-100', 'text-stone-900', 'shadow-md', 'ring-4', 'ring-stone-900/10');

            // Collect data
            currentVariantIndex = parseInt(this.dataset.index);
            const price = this.dataset.price;
            const stock = parseInt(this.dataset.stock);
            const image = this.dataset.image;
            
            // ... (rest of update UI logic)
            if ($('product-price')) $('product-price').innerText = `₹${price}`;
            
            const stockStatus = $('stock-status');
            const stockCount = $('stock-count');
            const addToCartBtn = $('add-to-cart-btn');

            if (stock > 0) {
                stockStatus.innerText = "In Stock";
                stockStatus.className = "text-sm font-medium px-3 py-1 bg-green-500/10 text-green-400 rounded-full";
                stockCount.innerText = `(${stock} available)`;
                addToCartBtn.disabled = false;
                addToCartBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            } else {
                stockStatus.innerText = "Out of Stock";
                stockStatus.className = "text-sm font-medium px-3 py-1 bg-red-500/10 text-red-400 rounded-full";
                stockCount.innerText = "";
                addToCartBtn.disabled = true;
                addToCartBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }

            if (image) $('main-image').src = image;
        });
    });

    // ── Image Zoom Logic ───────────────────────────────────────────────
    const zoomContainer = $('zoom-container');
    const mainImage = $('main-image');

    if (zoomContainer && mainImage) {
        zoomContainer.addEventListener('mousemove', (e) => {
            const rect = zoomContainer.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            mainImage.style.transformOrigin = `${x}% ${y}%`;
            mainImage.style.transform = "scale(2)";
        });

        zoomContainer.addEventListener('mouseleave', () => {
            mainImage.style.transform = "scale(1)";
            mainImage.style.transformOrigin = "center";
        });
    }

    // ── image thumbnails ───────────────────────────────────────────────
    document.querySelectorAll('.thumbnail-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.thumbnail-btn').forEach(b => {
                b.classList.remove('border-teal-700', 'shadow-md', 'ring-2', 'ring-teal-700/20');
                b.classList.add('border-stone-200');
            });
            this.classList.remove('border-stone-200');
            this.classList.add('border-teal-700', 'shadow-md', 'ring-2', 'ring-teal-700/20');
            $('main-image').src = this.dataset.src;
        });
    });

    // ── Qty Stepper ───────────────────────────────────────────────────
    const qtyInput = $('qty-input');
    if (qtyInput) {
        $('qty-plus')?.addEventListener('click', () => {
            qtyInput.value = parseInt(qtyInput.value) + 1;
        });
        $('qty-minus')?.addEventListener('click', () => {
            if (parseInt(qtyInput.value) > 1) {
                qtyInput.value = parseInt(qtyInput.value) - 1;
            }
        });
    }

    // ── Add to Cart ───────────────────────────────────────────────────
    $('add-to-cart-btn')?.addEventListener('click', async function() {
        if (this.disabled) return;

        const productId = this.dataset.productId;
        const qty = parseInt(qtyInput.value);

        const originalText = this.innerHTML;
        this.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Adding...`;
        this.disabled = true;

        try {
            const response = await axios.post('/user/cart/add', {
                productId,
                variantIndex: currentVariantIndex,
                quantity: qty
            });

            if (response.data.success) {
                alert('Added to cart!');
                // Optional: Update cart counter in navbar here
            } else {
                alert(response.data.message || 'Error adding to cart');
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                window.location.href = '/user/login';
            } else {
                console.error(error);
                alert('An error occurred. Make sure you are logged in.');
            }
        } finally {
            this.innerHTML = originalText;
            this.disabled = false;
        }
    });
});
