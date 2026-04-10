

const $ = id => document.getElementById(id);
async function storeSearch() {
    const query = $('searchInput').value.trim();
    try {
        const response = await axios.get('/user/store', {
            params: {search: query},

        })
        if(response.data.success) {

            renderProducts(response.data.products)
        }
    } catch(error) {
        console.error(" store search field error", e)
    }
}
function renderProducts(products) {
    const container = document.getElementById("productGrid");
    if(!container) {

        return;
    }
    if(!products.length) {
        container.innerHTML = `<p class="col-span-full text-center text-brand-muted">No products found</p>`;
        return;
    }

    container.innerHTML = products.map(product => `
    <div class="group">
      <div class="bg-brand-bg2 rounded-xl overflow-hidden border border-white/5 p-4">

        <img 
         src="${product.variants?.[0]?.images?.[0] || '/images/placeholder.png'}"
          class="w-full h-48 object-cover rounded-lg mb-3"
        />

        <h3 class="text-white font-semibold">${product.productName}</h3>
        <p class="text-sm text-brand-muted">${product.category?.categoryName || ''}</p>

        <p class="text-brand-accent font-bold mt-2">
          ₹${product.variants?.[0]?.price || product.basePrice}
        </p>

      </div>
    </div>
  `).join("");
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
        storeSearch();

    }, 400)
}
function clearSearch() {
    const input = $('searchInput');
    const clearBtn = $('clearSearchBtn');

    if(input && clearBtn) {
        input.value = '';
        clearBtn.classList.add('hidden');
        storeSearch();
    }
}

function toggleFilter(id) {
    const el = document.getElementById(id);
    el.classList.toggle('hidden');
}

function updatePriceLabel(val) {
    document.getElementById("priceValue").innerText = "₹" + val;
}

async function fetchAndRenderFilterOptions() {
    try {
        const response = await axios.get('/user/store/filter-options');
        if(response.data.success) {
            const {categories, materials, finishes, colors} = response.data.data;


            renderCheckboxGroup('catFilter', categories);
            renderCheckboxGroup('materialFilter', materials);
            renderCheckboxGroup('finishFilter', finishes);


            renderColorGroup('colorFilter', colors);
        }
    } catch(error) {
         console.error("Failed to load filter options:", error);
    }


}
function renderCheckboxGroup(containerId, items) {
    const container = document.getElementById(containerId);
    if (!container || !items.length) return;

    container.innerHTML = items.map(item => `
        <label class="flex items-center gap-2 text-sm text-brand-muted cursor-pointer">
            <input type="checkbox" value="${item}" class="accent-brand-accent filter-checkbox">
            <span>${item}</span>
        </label>
    `).join('');
}
function renderColorGroup(containerId, colors) {
    const container = document.getElementById(containerId);
    if (!container || !colors.length) return;

    container.innerHTML = colors.map(color => `
        <label class="w-6 h-6 rounded-full border border-white/20 cursor-pointer transition-transform hover:scale-110">
            <input type="checkbox" value="${color}" class="hidden filter-checkbox">
            <div class="w-full h-full rounded-full" style="background-color: ${color}"></div>
        </label>
    `).join('');
}