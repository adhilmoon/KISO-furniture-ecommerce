
function showFieldError(fieldId, message) {
    const errorEl = document.getElementById(`err-${fieldId}`);
    const inputEl = document.getElementById(fieldId);

    if(errorEl) errorEl.innerText = message;
    if(inputEl) {
        inputEl.classList.add('border-red-500', 'ring-1', 'ring-red-500');
        inputEl.focus();
    }
}
document.addEventListener('DOMContentLoaded', () => {


    const addBtn = document.getElementById('add-address-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            toggleAddressModal();
        });
    }

});

function toggleAddressModal() {
    const modal = document.getElementById('addressModal');
    const form = document.getElementById('addressForm');

    const isOpen = !modal.classList.contains('hidden');

    if (isOpen) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        form.reset();
        delete form.dataset.editId;
        document.querySelector('#addressModal h3').innerText = "Add New Address";
        resetValidation();
    } else {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}


async function deleteAddress(addressId) {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
        const response = await axios.delete(`/user/address/delete/${addressId}`);
        if (response.data.success) {
            window.location.reload();
        }
    } catch (error) {
        console.error('Error deleting address:', error);
        alert('Failed to delete address. Please try again.');
    }
}

async function editAddress(addressId) {
    try {
        const response = await axios.get(`/user/address/get/${addressId}`);
        const addr = response.data.address;

        document.getElementById('fullName').value = addr.fullName;
        document.getElementById('mobile').value = addr.mobile;
        document.getElementById('houseName').value = addr.houseName;
        document.getElementById('city').value = addr.city;
        document.getElementById('state').value = addr.state;
        document.getElementById('pincode').value = addr.pincode;
        document.getElementById('type').value = addr.type;
        document.querySelector('#addressModal h3').innerText = "Edit Address";
        document.getElementById('addressForm').dataset.editId = addressId;

        toggleAddressModal();
    } catch (error) {
        console.error('Error fetching address:', error);
        alert('Failed to load address');
    }
}

async function handleAddressSubmit(event) {
    event.preventDefault();
    resetValidation();

    const form = event.target;
    const editId = form.dataset.editId;

    const addressData = {
        fullName: document.getElementById('fullName').value.trim(),
        mobile: document.getElementById('mobile').value.trim(),
        houseName: document.getElementById('houseName').value.trim(),
        city: document.getElementById('city').value.trim(),
        state: document.getElementById('state').value.trim(),
        pincode: document.getElementById('pincode').value.trim(),
        type: document.getElementById('type').value
    };
    
    if (!addressData.fullName || addressData.fullName.length < 3) {
        return showFieldError('fullName', "Full Name must be at least 3 characters");
    }

    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(addressData.mobile)) {
        return showFieldError('mobile', "Please enter a valid 10-digit mobile number");
    }

    if (!addressData.houseName) {
        return showFieldError('houseName', "House Name/Area is required");
    }

    if (!addressData.city) return showFieldError('city', "City is required");
    if (!addressData.state) return showFieldError('state', "State is required");

    const pinRegex = /^\d{6}$/;
    if (!pinRegex.test(addressData.pincode)) {
        return showFieldError('pincode', "Pincode must be exactly 6 digits");
    }

    try {
        const url = editId ? `/user/address/update/${editId}` : '/user/address/add';
        const method = editId ? 'patch' : 'post';

        const response = await axios[method](url, addressData);

        if (response.data.success) {
            showMessage(response.data.message || 'Address saved!', 'success');
            setTimeout(() => location.reload(), 800);
        }
    } catch (error) {
        showMessage(error.response?.data?.message || 'Failed to save address', 'error');
    }
}

function resetValidation() {
    document.querySelectorAll('[id^="err-"]').forEach(el => el.innerText = '');
    document.querySelectorAll('#addressForm input, #addressForm select')
        .forEach(input => input.classList.remove('border-red-500', 'ring-1', 'ring-red-500'));
}

function showFieldError(fieldId, message) {
    const errorEl = document.getElementById(`err-${fieldId}`);
    const inputEl = document.getElementById(fieldId);

    if (errorEl) errorEl.innerText = message;
    if (inputEl) {
        inputEl.classList.add('border-red-500', 'ring-1', 'ring-red-500');
        inputEl.focus();
    }
}


function showMessage(message, type) {
    const colors = type === 'success'
        ? 'bg-green-100 text-green-800 border-green-300'
        : 'bg-red-100 text-red-800 border-red-300';

    const toast = document.createElement('div');
    toast.className = `fixed top-5 right-5 z-[9999] px-5 py-3 rounded-lg border text-sm font-medium shadow-lg transition-all ${colors}`;
    toast.innerText = message;

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

