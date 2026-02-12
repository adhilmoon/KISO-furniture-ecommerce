
async function deleteAddress(addressId) {

    if(!confirm('Are you sure you want to delete this address?')) return;

    try {
        const response = await axios.delete(`/user/address/delete/${addressId}`);
        if(response.data.success) {

            window.location.reload();
        }
    } catch(error) {
        console.error('Error deleting address:', error);
        alert('Failed to delete address. Please try again.');
    }
}

async function editAddress(addressId) {
    try {
        const response = await axios.get(`/user/address/get/${addressId}`);
        const addr = response.data.address;

        document.getElementById('addrName').value = addr.fullName;
        document.getElementById('addrMobile').value = addr.mobile;
        document.getElementById('addrHouse').value = addr.houseName;
        document.getElementById('addrCity').value = addr.city;
        document.getElementById('addrState').value = addr.state;
        document.getElementById('addrPincode').value = addr.pincode;
        document.getElementById('addrType').value = addr.type;

        document.querySelector('#addressModal h3').innerText = "Edit Address";
        document.getElementById('addressForm').dataset.editId = addressId;

        toggleAddressModal(); 
    } catch(error) {
        console.error('Error fetching address:', error);
        alert('Failed to load address');
    }
}


document.getElementById('add-address-btn').addEventListener('click', () => {
    toggleAddressModal()
});


function toggleAddressModal() {
    const modal = document.getElementById('addressModal');
    const form = document.getElementById('addressForm');
    
    // If closing the modal, reset it
    if (!modal.classList.contains('hidden')) {
        form.reset();
        delete form.dataset.editId;
        document.querySelector('#addressModal h3').innerText = "Add New Address";
    }
    
    modal.classList.toggle('hidden');
}

