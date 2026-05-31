


function resetValidationforcategory() {
    document.querySelectorAll('[id^="err-"]').forEach(el => el.innerText = '');
    document.querySelectorAll('#addCategoryForm input, #addCategoryForm select')
        .forEach(input => input.classList.remove('border-red-500', 'ring-1', 'ring-red-500'));
}

async function editCategory(categoryId) {
    try {
        const response = await axios.get(`/admin/category/get/${categoryId}`);
        const catelog = response.data.category;
        document.getElementById('name').value = catelog.categoryName;
        document.getElementById('description').value = catelog.description;

        const form = document.getElementById('addCategoryForm');
        form.dataset.editId = categoryId;

        document.querySelector('#addCategoryModal h2').innerText = "Edit Category";
        const submitBtn = document.querySelector('#addCategoryForm button[type="submit"]');
        if(submitBtn) submitBtn.innerText = "Update Category";

        toggleAddCategoryModal()
    } catch(error) {
        console.log('Error fetching category details')
        showToast(error.response?.data?.message || " ! Canot open the category", 'error')
    }
}
async function handleCategorysubmit(event) {
    event.preventDefault();
    resetValidationforcategory()
    const form = event.target;
    const editId = form.dataset.editId;


    const categoryName = document.getElementById('name').value.trim();
    const description = document.getElementById('description').value

    if(categoryName === "") {
        showFieldError('name', "Please enter a valid name")
        return false;
    }
    if(categoryName.length < 3) {
        showFieldError('name', "Category name must be at least three letters")
        return false;
    }
    if(description === "") {
        showFieldError('description', "description canot be a empty string ")
        return false
    }

    try {
        const url = editId ? `/admin/category/update/${editId}` : '/admin/category/add';
        const method = editId ? "patch" : "post";

        const response = await axios[method](url, {categoryName, description});

        if(response.data.success) {
            showToast(response.data.message || "Category created", 'success')
            setTimeout(() => location.href = '/admin/categories', 800);
        }

    } catch(error) {
        showToast(error.response?.data?.message || " ! Not created", 'error')
    }

}
function showFieldError(fieldId, message) {
    const errorEl = document.getElementById(`err-${fieldId}`);
    const inputEl = document.getElementById(fieldId);
    if(errorEl) errorEl.innerText = message;
    if(inputEl) {
        inputEl.classList.remove('focus:border-kiso-brown');
        inputEl.classList.add('border-red-500', 'ring-1', 'ring-red-500')
        inputEl.focus()
    }
}

async function disableCategory(categoryId) {
    const result = await confirmAction('Are you sure you want to disable this category?')
    if(!result.isConfirmed) return;
    try {
        const response = await axios.patch(`/admin/category/disable/${categoryId}`)
        if(response.data.success) {
            console.log(response.data)

            const statusTd = document.getElementById(`status-${categoryId}`);
            const actionTd = document.getElementById(`action-${categoryId}`);


            if(statusTd) {
                statusTd.innerHTML = `<span class="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-red-400/10 text-red-400 border border-red-400/20">Inactive</span>`;
            }
            if(actionTd) {
                actionTd.innerHTML = `<button onclick="enableCategory('${categoryId}')" class="bg-green-500/80 text-white px-4 py-1 rounded-lg text-xs hover:bg-green-600 transition font-medium">Enable</button>`;
            }

            showToast("Category disabled", "success");
        }
    } catch(error) {
        console.error("category disable side wrong", error)
        showToast(error.response?.data?.message || " can't disable it", 'error')
    }

}

async function enableCategory(categoryId) {
    const result = await confirmAction('Are you sure you want to enable this category?')
    if(!result.isConfirmed) return;
    try {
        const response = await axios.patch(`/admin/category/enable/${categoryId}`)
        if(response.data.success) {


            console.log(response.data)

            const statusTd = document.getElementById(`status-${categoryId}`);
            const actionTd = document.getElementById(`action-${categoryId}`);

            if(statusTd) {
                statusTd.innerHTML = `<span class="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-green-400/10 text-green-400 border border-green-400/20">Active</span>`;
            }
            if(actionTd) {
                actionTd.innerHTML = `<button onclick="disableCategory('${categoryId}')" class="bg-red-500/80 text-white px-4 py-1 rounded-lg text-xs hover:bg-red-600 transition font-medium">Disable</button>`;
            }

            showToast("Category enabled", "success");
        }
    } catch(error) {
        console.error("enable side error", error)
    }

}


// Pagination state — keeps search query consistent across page navigation.
const catState = { search: '', page: 1, perPage: 5, totalPages: 1, totalCategories: 0 };

async function handleSearch(page = 1) {
    const query = document.getElementById('searchInput').value.trim();
    catState.search = query;
    catState.page = page;
    try {
        const response = await axios.get('/admin/categories', {
            params: { search: query, page }
        })
        if(response.data.success) {
            const d = response.data;
            catState.perPage = d.perPage || catState.perPage;
            catState.totalPages = d.totalPages || 1;
            catState.totalCategories = d.totalCategories || 0;
            catState.page = d.currentPage || page;
            renderCategories(d.categories);
            renderPagination();
            // Keep URL in sync so refresh / share preserves the search + page.
            const qs = new URLSearchParams();
            if (query) qs.set('search', query);
            if (catState.page > 1) qs.set('page', catState.page);
            const url = qs.toString() ? `/admin/categories?${qs}` : '/admin/categories';
            window.history.replaceState({}, '', url);
        }
    } catch(error) {
        console.error("Search failed:", error.response?.data?.message || error.message);
    }
}

function renderPagination() {
    const showing = document.getElementById('showingText');
    const nav = document.getElementById('paginationNav');
    if (!showing || !nav) return;

    const { page, perPage, totalPages, totalCategories } = catState;

    if (totalCategories === 0) {
        showing.textContent = 'Showing 0 of 0 categories';
    } else {
        const from = ((page - 1) * perPage) + 1;
        const to = Math.min(page * perPage, totalCategories);
        showing.textContent = `Showing ${from} to ${to} of ${totalCategories} categories`;
    }

    const prevSvg = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>';
    const nextSvg = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>';
    let html = '';

    if (page > 1) {
        html += `<button type="button" data-page="${page - 1}" class="px-3 py-2 border border-white/10 rounded-lg text-brand-muted hover:bg-white/5 transition">${prevSvg}</button>`;
    }
    for (let i = 1; i <= totalPages; i++) {
        const active = i === page
            ? 'bg-white/10 text-kiso-text'
            : 'border border-white/10 text-brand-muted hover:bg-white/5';
        html += `<button type="button" data-page="${i}" class="px-4 py-2 rounded-lg text-sm transition ${active}">${i}</button>`;
    }
    if (page < totalPages) {
        html += `<button type="button" data-page="${page + 1}" class="px-3 py-2 border border-white/10 rounded-lg text-brand-muted hover:bg-white/5 transition">${nextSvg}</button>`;
    }
    nav.innerHTML = html;
}

// Delegate pagination clicks (works for both server-rendered <a> and JS <button>).
document.getElementById('paginationNav')?.addEventListener('click', (e) => {
    const el = e.target.closest('[data-page]');
    if (!el) return;
    e.preventDefault();
    const page = parseInt(el.dataset.page, 10);
    if (Number.isInteger(page)) handleSearch(page);
});

function renderCategories(categories) {
    const tableBody = document.getElementById("categoryTableBody")

    tableBody.innerHTML = "";

    if(categories.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-brand-muted">No categories found.</td></tr>';
        return;
    }
    const offset = (catState.page - 1) * catState.perPage;
    categories.forEach((category, index) => {
        const dateStr = new Date(category.createdAt).toISOString().split('T')[0];
        const row = `
  <tr class="hover:bg-white/5 transition category-row" data-name="${category.categoryName.toLowerCase()}">
    <td class="px-6 py-4 whitespace-nowrap">
      <span class="text-kiso-text font-medium">C#${String(offset + index + 1).padStart(3, '0')}</span>
    </td>

    <td class="px-6 py-4 whitespace-nowrap">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-kiso-bg text-xs font-bold">
          ${category.categoryName.charAt(0).toUpperCase()}
        </div>
        <span class="text-kiso-text font-medium">
          ${category.categoryName}
        </span>
      </div>
    </td>

    <td class="px-6 py-4 whitespace-nowrap">
      <span class="text-brand-muted text-sm">
        ${dateStr}
      </span>
    </td>

    <td class="px-6 py-4">
      <span class="text-brand-muted text-sm">
        ${category.description || 'N/A'}
      </span>
    </td>

    <td class="px-6 py-4 whitespace-nowrap">
      <span class="text-kiso-text font-medium">
        ${category.productCount || 0}
      </span>
    </td>

    <td class="px-6 py-4 whitespace-nowrap" id="status-${category._id}">
      ${category.isActive ?
                `<span class="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-green-400/10 text-green-400 border border-green-400/20">Active</span>` :
                `<span class="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-red-400/10 text-red-400 border border-red-400/20">Inactive</span>`
            }
    </td>

    <td class="px-6 py-4 whitespace-nowrap">
      <a href="/admin/category/edit/${category._id}" class="border border-green-400/40 text-green-400 px-4 py-1 rounded-full text-xs hover:bg-green-400/10 transition inline-block text-center">
        Edit
      </a>
    </td>

    <td class="px-6 py-4 whitespace-nowrap" id="action-${category._id}">
      ${category.isActive ?
                `<button onclick="disableCategory('${category._id}')" class="bg-red-500/80 text-white px-4 py-1 rounded-lg text-xs hover:bg-red-600 transition font-medium">Disable</button>` :
                `<button onclick="enableCategory('${category._id}')" class="bg-green-500/80 text-white px-4 py-1 rounded-lg text-xs hover:bg-green-600 transition font-medium">Enable</button>`
            }
    </td>
  </tr>`;
        tableBody.insertAdjacentHTML('beforeend', row);
    })
}
let timeout;
function handleSearchDebounced() {
    const clearBtn = document.getElementById('clearSearchBtn');
    const input = document.getElementById('searchInput');
    if(input && clearBtn) {
        if(input.value.trim() !== '') {
            clearBtn.classList.remove('hidden');
        } else {
            clearBtn.classList.add('hidden');
        }
    }

    clearTimeout(timeout)

    timeout = setTimeout(() => {
        handleSearch(1); // new query → always restart on page 1
    }, 400)
}

function clearSearch() {
    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    if(input && clearBtn) {
        input.value = '';
        clearBtn.classList.add('hidden');
        handleSearch(1);
    }
}

