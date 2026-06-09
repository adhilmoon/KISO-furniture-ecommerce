

const $ = id => document.getElementById(id)

async function loadProducts(page = 1) {
    const query = ($('searchInput')?.value || '').trim();
    try {
        const qs = new URLSearchParams();
        if (query) qs.set('search', query);
        if (page > 1) qs.set('page', page);
        window.history.replaceState({}, '', qs.toString() ? `/admin/products?${qs.toString()}` : '/admin/products');

        const { data } = await axios.get('/admin/products', { params: { search: query, page } });
        if (data.success) {
            renderProducts(data.products);
            renderPagination(data);
        }
    } catch (e) {
        console.error("product load error", e);
    }
}

// Build pagination from filtered result counts
function renderPagination({ currentPage, totalPages, totalProducts, perPage }) {
    const container = $('productPagination');
    if (!container) return;

    if (!totalPages || totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    const from = ((currentPage - 1) * perPage) + 1;
    const to = Math.min(currentPage * perPage, totalProducts);
    const icon = d => `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${d}" /></svg>`;

    let nav = '';
    if (currentPage > 1) {
        nav += `<button type="button" onclick="loadProducts(${currentPage - 1})" class="px-3 py-2 border border-white/10 rounded-lg text-brand-muted hover:bg-white/5 transition">${icon('M15 19l-7-7 7-7')}</button>`;
    }
    for (let i = 1; i <= totalPages; i++) {
        const cls = i === currentPage ? 'bg-white/10 text-kiso-text' : 'border border-white/10 text-brand-muted hover:bg-white/5';
        nav += `<button type="button" onclick="loadProducts(${i})" class="px-4 py-2 rounded-lg text-sm transition ${cls}">${i}</button>`;
    }
    if (currentPage < totalPages) {
        nav += `<button type="button" onclick="loadProducts(${currentPage + 1})" class="px-3 py-2 border border-white/10 rounded-lg text-brand-muted hover:bg-white/5 transition">${icon('M9 5l7 7-7 7')}</button>`;
    }

    container.innerHTML = `
        <div class="flex items-center justify-between mt-6">
            <p class="text-brand-muted text-sm">Showing ${from} to ${to} of ${totalProducts} products</p>
            <div class="flex items-center gap-2">${nav}</div>
        </div>
    `;
}
function renderProducts(products) {
    const tbody = $('productTableBody');
    if(!tbody) return;


    tbody.innerHTML = '';

    if(!products || products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-12 text-center text-brand-muted">
                    No products found matching your search.
                </td>
            </tr>
        `;
        return;
    }

    // Render each product
    products.forEach(product => {
        const displayImage = product.variants?.[0]?.images?.[0] || null;
        const categoryName = product.category?.categoryName || 'Uncategorized';
        const totalQuantity = product.totalQuantity || 0;

        // Stock color logic
        let stockHTML = '';
        if(totalQuantity > 10) {
            stockHTML = `<span class="text-green-400 font-medium">${totalQuantity}</span>`;
        } else if(totalQuantity > 0) {
            stockHTML = `<span class="text-yellow-400 font-medium">${totalQuantity}</span>`;
        } else {
            stockHTML = `<span class="text-red-400 font-medium">Out of stock</span>`;
        }

        // Status badge
        const statusHTML = product.isActive
            ? `<span class="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-green-400/10 text-green-400 border border-green-400/20">Active</span>`
            : `<span class="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-red-400/10 text-red-400 border border-red-400/20">Inactive</span>`;

        // Action button
        const actionHTML = product.isActive
            ? `<button onclick="disableProduct('${product._id}')" class="bg-red-500/80 text-white px-4 py-1 rounded-lg text-xs hover:bg-red-600 transition font-medium w-full max-w-[80px]">Disable</button>`
            : `<button onclick="enableProduct('${product._id}')" class="bg-green-500/80 text-white px-4 py-1 rounded-lg text-xs hover:bg-green-600 transition font-medium w-full max-w-[80px]">Enable</button>`;

        const row = `
            <tr class="hover:bg-white/5 transition product-row" data-name="${(product.productName || '').toLowerCase()}">
                <!-- Image + Name -->
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded bg-brand-bg2 border border-white/10 overflow-hidden flex-shrink-0">
                            ${displayImage
                ? `<img src="${displayImage}" alt="${product.productName}" class="w-full h-full object-cover" />`
                : `<div class="w-full h-full flex items-center justify-center text-brand-muted text-xs">Image</div>`
            }
                        </div>
                        <div>
                            <p class="text-kiso-text font-medium">${product.productName}</p>
                        </div>
                    </div>
                </td>

                <!-- SKU -->
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-brand-muted font-mono text-xs">${product.sku || 'N/A'}</span>
                </td>

                <!-- Category -->
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-brand-muted text-sm">${categoryName}</span>
                </td>

                <!-- Price -->
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-kiso-text font-medium">₹${(product.basePrice || 0).toFixed(1)}</span>
                </td>

                <!-- Stock -->
                <td class="px-6 py-4 whitespace-nowrap">
                    ${stockHTML}
                </td>

                <!-- Status -->
                <td class="px-6 py-4 whitespace-nowrap" id="status-${product._id}">
                    ${statusHTML}
                </td>

                <!-- Edit -->
                <td class="px-6 py-4 whitespace-nowrap">
                    <a href="/admin/product/edit/${product._id}" 
                       class="border border-green-400/40 text-green-400 px-4 py-1 rounded-full text-xs hover:bg-green-400/10 transition inline-block text-center">
                        Edit
                    </a>
                </td>

                <!-- Action -->
                <td class="px-6 py-4 whitespace-nowrap" id="action-${product._id}">
                    ${actionHTML}
                </td>
            </tr>
        `;

        tbody.insertAdjacentHTML('beforeend', row);
    });
}

let timeout;
function handleSearchDebounced() {
    const clearBtn = $('clearSearchBtn');
    const input = $('searchInput');
    if(input && clearBtn) {
        if(input.value.trim() !== "") {
            clearBtn.classList.remove('hidden')
        } else {
            clearBtn.classList.add("hidden")
        }
    }
    clearTimeout(timeout)
    timeout = setTimeout(() => {
        loadProducts(1);

    }, 1000)
}



function clearSearch() {
    const input = $('searchInput');
    const clearBtn = $('clearSearchBtn');

    if(input && clearBtn) {
        input.value = '';
        clearBtn.classList.add('hidden');
        loadProducts(1);
    }
}

async function disableProduct(productId) {
    const result = await confirmAction('Are you suer you want to disable the product')
    if(!result.isConfirmed) return;
    try {
        const response = await axios.patch(`/admin/product/disable/${productId}`)
        if(response.data.success) {
            const ststusId = $(`status-${productId}`)
            const actionId = $(`action-${productId}`);
            if(ststusId) {
                ststusId.innerHTML = `<span  class="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-red-400/10 text-red-400 border border-red-400/20">Inactive</span>`
            }
            if(actionId) {
                actionId.innerHTML = `<button onclick="enableProduct('${productId}')"
                 class="bg-green-500/80 text-white px-4 py-1 rounded-lg text-xs hover:bg-green-600 transition font-medium w-full max-w-[80px]">
                  Enable
                 </button>`
            }
            showToast("product disabled ", "success")
        }
    } catch(e) {
        console.error("product disable side error :", e)
    }

}

async function enableProduct(productId) {
    const result = await confirmAction('Are you suer you want to enable the product')
    if(!result.isConfirmed) return;
    try {
        const response = await axios.patch(`/admin/product/enable/${productId}`)
        if(response.data.success) {
            const ststusId = $(`status-${productId}`)
            const actionId = $(`action-${productId}`);
            if(ststusId) {
                ststusId.innerHTML = `<span class="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-green-400/10 text-green-400 border border-green-400/20"> Active</span>`
            }
            if(actionId) {
                actionId.innerHTML = `<button onclick="disableProduct('${productId}')"
                 class="bg-red-500/80 text-white px-4 py-1 rounded-lg text-xs hover:bg-red-600 transition font-medium w-full max-w-[80px]">
                Disable
              </button>`
            }
            showToast("product enabled", "success")
        }
    } catch(e) {
        console.error("product enable side error :", e)
    }

}

