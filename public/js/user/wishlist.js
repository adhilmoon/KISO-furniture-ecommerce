// Remove one wishlist card from the DOM (no full-page reload) and refresh the
// nav badge. If it was the last card, swap the grid for the empty state.
function removeWishlistCard(productId, variantIndex) {
    const grid = document.getElementById('wishlistGrid');
    if (grid) {
        const card = grid.querySelector(
            `[data-wishlist-card][data-product-id="${productId}"][data-variant-index="${variantIndex}"]`
        );
        if (card) card.remove();
        if (!grid.querySelector('[data-wishlist-card]')) renderEmptyWishlist();
    }
    if (window.refreshNavBadges) window.refreshNavBadges();
}

function renderEmptyWishlist() {
    const addAllBtn = document.getElementById('addAllBtn');
    if (addAllBtn) addAllBtn.remove();
    const grid = document.getElementById('wishlistGrid');
    if (!grid) return;
    const empty = document.createElement('div');
    empty.className = 'flex flex-col items-center justify-center py-24 text-center';
    empty.innerHTML = `
        <div class="w-24 h-24 bg-brand-bg2 rounded-full flex items-center justify-center mb-8 border border-white/5">
            <svg class="w-12 h-12 text-brand-muted opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
        </div>
        <h2 class="text-2xl font-bold text-brand-light mb-4">Your wishlist is empty</h2>
        <p class="text-brand-muted mb-10 max-w-sm">Explore our collection and save your favorite pieces here.</p>
        <a href="/user/store" class="px-8 py-4 bg-brand-accent text-brand-bg1 font-bold rounded-xl hover:bg-yellow-600 transition-all shadow-xl shadow-brand-accent/20">
            Browse Collection
        </a>`;
    grid.replaceWith(empty);
}

async function removeFromWishlist(productId, variantIndex) {
    try {
        const result = await confirmAction('Remove this item from your wishlist?', 'question');
        if (!result.isConfirmed) return;

        const url = variantIndex != null
            ? `/user/wishlist/item/${productId}?variantIndex=${variantIndex}`
            : `/user/wishlist/item/${productId}`;
        const response = await axios.delete(url);
        if (response.data.success) {
            showToast('Item removed from wishlist', 'success');
            removeWishlistCard(productId, variantIndex);
        }
    } catch (error) {
        showToast(error.response?.data?.message || 'Error removing item', 'error');
    }
}

async function addFromWishlistToCart(productId, variantIndex) {
    try {
        const response = await axios.post('/user/cart/add', {
            productId,
            variantIndex,
            quantity: 1
        });

        if (response.data.success) {
            showToast('Added to cart!', 'success');
            // Service moves the item out of the wishlist on add-to-cart, so drop
            // its card from the view in place — no reload.
            removeWishlistCard(productId, variantIndex);
        }
    } catch (error) {
        showToast(error.response?.data?.message || 'Error adding to cart', 'error');
    }
}
async function addAllToCart() {
    try {
        const result = await confirmAction('Add all available items to cart?', 'question');
        if (!result.isConfirmed) return;

        showLoadingModal('Adding to Cart', 'Moving items from your wishlist...');

        const response = await axios.post('/user/wishlist/add-all');
        
        if (response.data.success) {
            const { added, skipped } = response.data.results;
            
            // Determine Title, Icon, and Button Text based on outcome
            let title = 'Operation Complete';
            let icon = 'info';
            let btnText = 'Great';
            let successMessage = '';

            const totalSkipped = skipped.outOfStock + skipped.limitReached + skipped.unavailable;

            if (added > 0 && totalSkipped === 0) {
                title = 'Success!';
                icon = 'success';
                btnText = 'Perfect';
                successMessage = `${added} items added successfully!`;
            } else if (added > 0 && totalSkipped > 0) {
                title = 'Cart Updated';
                icon = 'success';
                btnText = 'Got it';
                successMessage = `${added} items added successfully.`;
            } else if (added === 0) {
                if (skipped.limitReached > 0 && skipped.outOfStock === 0 && skipped.unavailable === 0) {
                    title = 'Purchase Limit Reached';
                    icon = 'warning';
                    btnText = 'I Understand';
                } else {
                    title = 'No Items Added';
                    icon = 'info';
                    btnText = 'OK';
                }
                successMessage = 'No new items were added to your cart.';
            }

            let messageHtml = `<div class="text-left space-y-4 py-2">`;
            
            if (added > 0) {
                messageHtml += `
                <div class="flex items-center gap-3 text-green-400 bg-green-400/5 p-3 rounded-lg border border-green-400/10">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    <p class="font-bold">${successMessage}</p>
                </div>`;
            } else {
                messageHtml += `
                <div class="flex items-center gap-3 text-brand-muted bg-white/5 p-3 rounded-lg border border-white/5">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <p class="font-bold">${successMessage}</p>
                </div>`;
            }
            
            if (totalSkipped > 0) {
                messageHtml += `
                <div class="space-y-2 px-1">
                    <p class="text-xs uppercase tracking-widest text-brand-muted font-bold opacity-60">Summary of skipped items</p>
                    <div class="space-y-1.5">
                        ${skipped.outOfStock > 0 ? `
                            <div class="flex items-center justify-between text-sm text-brand-muted/80 bg-white/[0.02] px-3 py-2 rounded-md">
                                <span>Out of stock</span>
                                <span class="font-bold text-red-400/80">${skipped.outOfStock}</span>
                            </div>` : ''}
                        ${skipped.limitReached > 0 ? `
                            <div class="flex items-center justify-between text-sm text-brand-muted/80 bg-white/[0.02] px-3 py-2 rounded-md">
                                <span>Purchase limit reached (max 3)</span>
                                <span class="font-bold text-yellow-400/80">${skipped.limitReached}</span>
                            </div>` : ''}
                        ${skipped.unavailable > 0 ? `
                            <div class="flex items-center justify-between text-sm text-brand-muted/80 bg-white/[0.02] px-3 py-2 rounded-md">
                                <span>Currently unavailable</span>
                                <span class="font-bold text-brand-muted">${skipped.unavailable}</span>
                            </div>` : ''}
                    </div>
                </div>`;
            }
            messageHtml += `</div>`;

            await showResultModal(title, messageHtml, icon, btnText);

            if (added > 0) {
                window.location.reload();
            }
        }
    } catch (error) {
        Swal.close();
        showToast(error.response?.data?.message || 'Error adding items to cart', 'error');
    }
}
