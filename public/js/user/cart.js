document.addEventListener('DOMContentLoaded', () => {
    let selectedItemId = null;
    let selectedRowEl = null;

    const modal = document.getElementById('removeModal');
    const confirmRemoveBtn = document.getElementById('confirmRemove');
    const moveToWishlistBtn = document.getElementById('moveToWishlistBtn');
    const modalTitle = document.getElementById('removeModalTitle');
    const modalBody = document.getElementById('removeModalBody');

    const DEFAULT_TITLE = 'Remove Item?';
    const DEFAULT_BODY = 'Save it for later or remove permanently?';
    const UNAVAILABLE_TITLE = 'Item Unavailable';
    const UNAVAILABLE_BODY = 'This product is currently unavailable. Move it to wishlist or remove it from your cart?';

    const openRemoveModal = (id, row, { unavailable = false } = {}) => {
        selectedItemId = id;
        selectedRowEl = row;
        if (modalTitle) modalTitle.textContent = unavailable ? UNAVAILABLE_TITLE : DEFAULT_TITLE;
        if (modalBody) modalBody.textContent = unavailable ? UNAVAILABLE_BODY : DEFAULT_BODY;
        modal.classList.remove('opacity-0', 'pointer-events-none');
        modal.querySelector('div').classList.remove('scale-95');
        modal.querySelector('div').classList.add('scale-100');
    };

    window.closeRemoveModal = () => {
        modal.classList.add('opacity-0', 'pointer-events-none');
        modal.querySelector('div').classList.add('scale-95');
        modal.querySelector('div').classList.remove('scale-100');
        selectedItemId = null;
        selectedRowEl = null;
    };

    if (confirmRemoveBtn) {
        confirmRemoveBtn.addEventListener('click', () => {
            if (selectedItemId && selectedRowEl) {
                removeItem(selectedItemId, selectedRowEl);
                closeRemoveModal();
            }
        });
    }

    const moveToWishlist = async (itemId, rowEl) => {
        const productId = rowEl.dataset.productId;
        const variantIndex = parseInt(rowEl.dataset.variantIndex, 10) || 0;
        rowEl.style.opacity = '0.5';
        try {
            const wishlistRes = await axios.post('/user/wishlist/toggle', { productId, variantIndex });
            // If toggle removed it (already in wishlist), we re-add by toggling again
            if (wishlistRes.data?.action === 'removed') {
                await axios.post('/user/wishlist/toggle', { productId, variantIndex });
            }
            const removeRes = await axios.delete(`/user/cart/item/${itemId}`);
            if (removeRes.data.success) {
                rowEl.remove();
                updateCartTotals();
                showToast('Moved to wishlist', 'success');
                if (document.querySelectorAll('.cart-item').length === 0) {
                    window.location.reload();
                }
            }
        } catch (error) {
            rowEl.style.opacity = '1';
            showToast(error.response?.data?.message || 'Failed to move item to wishlist', 'error');
        }
    };

    if (moveToWishlistBtn) {
        moveToWishlistBtn.addEventListener('click', () => {
            if (selectedItemId && selectedRowEl) {
                moveToWishlist(selectedItemId, selectedRowEl);
                closeRemoveModal();
            }
        });
    }

    const updateCartTotals = () => {
        let subtotal = 0;
        document.querySelectorAll('.cart-item').forEach(item => {
            
            const isListed = item.dataset.isListed === 'true';
            const isOutOfStock = item.dataset.isOutOfStock === 'true';
            if (isListed && !isOutOfStock) {
                const price = parseFloat(item.querySelector('.item-price').textContent);
                const qty = parseInt(item.querySelector('.qty-input').value);
                const itemTotal = price * qty;
                item.querySelector('.item-total').innerText = itemTotal;
                subtotal += itemTotal;
            } else {
                item.querySelector('.item-total').innerText = '0';
            }
        });

        const summarySubtotal = document.getElementById('summary-subtotal');
        const summaryTotal = document.getElementById('summary-total');
        if (summarySubtotal) summarySubtotal.innerText = subtotal;
        if (summaryTotal) summaryTotal.innerText = subtotal;
    };

    const MAX_PER_USER = 3;

    const refreshQtyButtons = (row) => {
        const isListed = row.dataset.isListed === 'true';
        const isOutOfStock = row.dataset.isOutOfStock === 'true';
        const input = row.querySelector('.qty-input');
        const minusBtn = row.querySelector('.minus-btn');
        const plusBtn = row.querySelector('.plus-btn');
        if (!input || !minusBtn || !plusBtn) return;

        const setDisabled = (btn, disabled) => {
            btn.disabled = disabled;
            btn.classList.toggle('opacity-30', disabled);
            btn.classList.toggle('cursor-not-allowed', disabled);
        };

        if (!isListed || isOutOfStock) {
            setDisabled(minusBtn, true);
            setDisabled(plusBtn, true);
            return;
        }

        const qty = parseInt(input.value, 10) || 0;
        const stock = parseInt(input.dataset.stock, 10) || 0;
        const maxAllowed = Math.min(stock, MAX_PER_USER);

        setDisabled(minusBtn, qty <= 1);
        setDisabled(plusBtn, qty >= maxAllowed);
    };

    const updateQuantity = async (itemId, newQty, inputEl) => {
        const originalValue = inputEl.value;
        const row = inputEl.closest('.cart-item');
        try {
            inputEl.value = newQty;
            updateCartTotals();
            if (row) refreshQtyButtons(row);

            const response = await axios.patch(`/user/cart/item/${itemId}`, { quantity: newQty });
            if (!response.data.success) {
                throw new Error(response.data.message);
            }
        } catch (error) {
            console.error('Failed to update qty:', error);
            inputEl.value = originalValue;
            updateCartTotals();
            if (row) refreshQtyButtons(row);
            showToast(error.message || 'Failed to update quantity. Please try again.', 'error');
        }
    };

    const removeItem = async (itemId, rowEl) => {
        rowEl.style.opacity = '0.5';
        try {
            const response = await axios.delete(`/user/cart/item/${itemId}`);
            if (response.data.success) {
                rowEl.remove();
                updateCartTotals();
                if (document.querySelectorAll('.cart-item').length === 0) {
                    window.location.reload();
                }
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            console.error('Failed to remove item:', error);
            rowEl.style.opacity = '1';
            showToast(error.message || 'Failed to remove item. Please try again.', 'error');
        }
    };

    const clearCart = async () => {
        if (!confirm('Are you sure you want to clear your entire cart?')) return;
        try {
            const response = await axios.delete('/user/cart');
            if (response.data.success) {
                window.location.reload();
            }
        } catch (error) {
            showToast('Failed to clear cart. Please try again.', 'error');
        }
    };

    document.querySelectorAll('.cart-item').forEach(row => {
        const itemId = row.dataset.itemId;
        const isListed = row.dataset.isListed === 'true';
        const isOutOfStock = row.dataset.isOutOfStock === 'true';
        const input = row.querySelector('.qty-input');
        const minusBtn = row.querySelector('.minus-btn');
        const plusBtn = row.querySelector('.plus-btn');
        const removeBtn = row.querySelector('.remove-btn');
        const stock = parseInt(input.dataset.stock, 10) || 0;

        if (!isListed || isOutOfStock) {
            input.disabled = true;
            row.classList.add('grayscale-[0.5]');
        }

        minusBtn.addEventListener('click', () => {
            if (minusBtn.disabled) return;
            if (!isListed) {
                showToast('This product is unavailable.', 'warning');
                return;
            }
            if (isOutOfStock) {
                showToast('This product is out of stock.', 'warning');
                return;
            }
            const currentQty = parseInt(input.value, 10);
            if (currentQty > 1) {
                updateQuantity(itemId, currentQty - 1, input);
            }
        });

        plusBtn.addEventListener('click', () => {
            if (plusBtn.disabled) {
                if (!isListed || isOutOfStock) {
                    openRemoveModal(itemId, row, { unavailable: true });
                }
                return;
            }
            const currentQty = parseInt(input.value, 10);
            if (currentQty >= stock) {
                showToast('Maximum available stock reached', 'warning');
                return;
            }
            if (currentQty >= MAX_PER_USER) {
                showToast(`Maximum ${MAX_PER_USER} units allowed per user`, 'warning');
                return;
            }
            updateQuantity(itemId, currentQty + 1, input);
        });

        removeBtn.addEventListener('click', () => {
            openRemoveModal(itemId, row, { unavailable: !isListed || isOutOfStock });
        });

        refreshQtyButtons(row);
    });

    const clearBtn = document.getElementById('clear-cart-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearCart);
    }

    updateCartTotals();
});
const checkoutBtn = document.getElementById('proceedToCheckoutBtn');
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
        try {
            checkoutBtn.disabled = true;
            checkoutBtn.innerHTML = '<span class="animate-spin mr-2">◌</span> Processing...';
            
            const response = await axios.get('/user/checkout', {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });

            if (response.data.success) {
                const invalidItems = response.data.invalidItems || [];
                if (invalidItems.length > 0) {
                    const listHtml = `<ul class="text-left list-disc pl-5 space-y-2 text-sm text-brand-muted mt-4">
                        ${invalidItems.map(item => `<li>${item}</li>`).join('')}
                    </ul>`;

                    // Use global themed modal
                    await showResultModal(
                        'Items Unavailable',
                        `<p class="text-sm text-brand-light text-left">Some items are no longer available and will be filtered out from your checkout:</p>${listHtml}`,
                        'warning',
                        'Proceed to Checkout'
                    ).then(() => {
                        window.location.href = response.data.redirectUrl;
                    });
                } else {
                    window.location.href = response.data.redirectUrl;
                }
            } else {
                // Use global themed modal for error
                await showResultModal(
                    'Checkout Blocked',
                    response.data.message || 'No valid items available for checkout.',
                    'error',
                    'Back to Cart'
                ).then(() => window.location.reload());
            }
        } catch (error) {
            console.error('checkout error:', error);
            showToast('Something went wrong. Please try again.', 'error');
        } finally {
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = 'Proceed to Checkout';
        }
    });
}
