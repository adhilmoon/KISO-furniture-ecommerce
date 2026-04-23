document.addEventListener('DOMContentLoaded', () => {

    const updateCartTotals = () => {
        let subtotal = 0;
        document.querySelectorAll('.cart-item').forEach(item => {
            const price = parseFloat(item.querySelector('.item-price').textContent);
            const qty = parseInt(item.querySelector('.qty-input').value);
            const itemTotal = price * qty;
            item.querySelector('.item-total').innerText = itemTotal;
            subtotal += itemTotal;
        });

        const summarySubtotal = document.getElementById('summary-subtotal');
        const summaryTotal = document.getElementById('summary-total');
        if(summarySubtotal) summarySubtotal.innerText = subtotal;
        if(summaryTotal) summaryTotal.innerText = subtotal;
    };

    const updateQuantity = async (itemId, newQty, inputEl) => {
        try {
            originalValue = inputEl.value;
            inputEl.value = newQty;
            updateCartTotals();

            const response = await axios.patch(`/user/cart/item/${itemId}`, {quantity: newQty});
            if(!response.data.success) {
                throw new Error(response.data.message);
            }
        } catch(error) {
            console.error('Failed to update qty:', error);
            inputEl.value = originalValue;
            updateCartTotals();
            showToast(error.message || 'Failed to update quantity. Please try again.', 'error');
        }
    };

    const removeItem = async (itemId, rowEl) => {
        rowEl.style.opacity = '0.5';
        try {
            const response = await axios.delete(`/user/cart/item/${itemId}`);
            if(response.data.success) {
                rowEl.remove();
                updateCartTotals();
                if(document.querySelectorAll('.cart-item').length === 0) {
                    window.location.reload();
                }
            } else {
                throw new Error(response.data.message);
            }
        } catch(error) {
            console.error('Failed to remove item:', error);
            rowEl.style.opacity = '1';
            showToast(error.message || 'Failed to remove item. Please try again.', 'error');
        }
    };

    const clearCart = async () => {
        const result = await confirmAction("Are you sure you want to clear cart")
        if(!result.isConfirmed) return
        try {
            const response = await axios.delete('/user/cart');
            if(response.data.success) {
                window.location.reload();
            }
        } catch(error) {
            showToast('Failed to clear cart. Please try again.', 'error');
        }
    };


    document.querySelectorAll('.cart-item').forEach(row => {
        const itemId = row.dataset.itemId;
        const input = row.querySelector('.qty-input');
        const minusBtn = row.querySelector('.minus-btn');
        const plusBtn = row.querySelector('.plus-btn');
        const removeBtn = row.querySelector('.remove-btn');
        const stock = parseInt(input.dataset.stock);

        minusBtn.addEventListener('click', () => {
            const currentObj = parseInt(input.value);
            if(currentObj > 1) {
                updateQuantity(itemId, currentObj - 1, input);
            }
        });

        plusBtn.addEventListener('click', () => {
            const currentObj = parseInt(input.value);
            if(currentObj < stock && currentObj < 5) { // Assuming max 5 per person
                updateQuantity(itemId, currentObj + 1, input);
            } else {
                showToast(`Maximum quantity reached for this item.`, 'warning');
            }
        });

        removeBtn.addEventListener('click', () => {
            removeItem(itemId, row);
        });
    });

    const clearBtn = document.getElementById('clear-cart-btn');
    if(clearBtn) {
        clearBtn.addEventListener('click', clearCart);
    }

    // Run once on load to ensure initial totals are calculated
    updateCartTotals();
});
