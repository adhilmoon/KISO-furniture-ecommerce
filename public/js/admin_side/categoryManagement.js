

function toggleAddCategoryModal() {
    const modal = document.getElementById('addCategoryModal')
    const form = document.getElementById('addCategoryForm')

    const isOpen = !modal.classList.contains('hidden');

    if(isOpen) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        form.reset();
        delete form.dataset.editId;
        document.querySelector('#addCategoryModal h2').innerText = "Add New Category";
        const submitBtn = document.querySelector('#addCategoryForm button[type="submit"]');
        if (submitBtn) submitBtn.innerText = "Add Category";
        resetValidationforcategory();
    } else {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function resetValidationforcategory() {
    document.querySelectorAll('[id^="err-"]').forEach(el => el.innerText = '');
    document.querySelectorAll('#addCategoryForm input, #addCategoryForm select')
        .forEach(input => input.classList.remove('border-red-500', 'ring-1', 'ring-red-500'));
}

async function editCategory(categoryId) {
    try {
        const response = await axios.get(`/admin/category/get/${categoryId}`);
        const catelog=response.data.category;
        document.getElementById('name').value=catelog.categoryName;
        document.getElementById('description').value=catelog.description;
        
        const form = document.getElementById('addCategoryForm');
        form.dataset.editId = categoryId;
        
        document.querySelector('#addCategoryModal h2').innerText = "Edit Category";
        const submitBtn = document.querySelector('#addCategoryForm button[type="submit"]');
        if (submitBtn) submitBtn.innerText = "Update Category";
        
        toggleAddCategoryModal()
    } catch(error) {
       console.log('Error fetching category details')
        showToast(error.response?.data?.message || " ! Canot open the category", 'false')
    }
}
const handleCategorysubmit = async (event) => {
    event.preventDefault();
    resetValidationforcategory()
    const form = event.target;
    const editId = form.dataset.editId;


    const categoryName = document.getElementById('name').value.trim();
    const description = document.getElementById('description').value

    if(categoryName === "") {
        showFieldError('name', "pleas Enter valied name")
        return false;
    }
    if(categoryName.length < 3) {
        showFieldError('name', "category name atleast three letters")
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
            setTimeout(() => location.reload(), 800);
        }

    } catch(error) {
        showToast(error.response?.data?.message || " ! Not created", 'false')
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

async function deleteCategory(categoryId) {
    const result = await confirmAction('Are you sure you want to delete this category?')
    if(!result.isConfirmed) return;
    try {
        const response = await axios.patch(`/admin/category/delete/${categoryId}`)
        if(response.data.success) {
            window.location.reload();
        }
    } catch(error) {
        console.log("category deleted side wrong")
         showToast(error.response?.data?.message || " can't delete it", 'false')
    }

}