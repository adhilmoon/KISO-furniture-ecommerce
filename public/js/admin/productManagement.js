

const $ = id => document.getElementById(id)
async function productSearch() {
    const query = $('searchInput').value.trim();
    try {
        const response = await axios.get('/admin/products', {
            params: {
                search: query
            }
        })
        if(response.data.success) {
            console.log("products in searh field:", response.data?.products)
            renderProducts(response.data.products)
        }
    } catch(e) {
        console.error("search field error", e)
    }
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
        productSearch();

    }, 1000)
}



function clearSearch() {
    const input = $('searchInput');
    const clearBtn = $('clearSearchBtn');

    if(input && clearBtn) {
        input.value = '';
        clearBtn.classList.add('hidden');
        productSearch();
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

