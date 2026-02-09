
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

    
    function editAddress(addressId) {
       
        window.location.href = `/user/address/edit/${addressId}`;
    }

   
    document.getElementById('add-address-btn').addEventListener('click', () => {
       toggleAddressModal()
    });


function toggleAddressModal() {
    const modal = document.getElementById('addressModal');
    modal.classList.toggle('hidden');
}

