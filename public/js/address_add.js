async function handleAddressSubmit(event) {
    event.preventDefault();

    const form = document.getElementById('addressForm');
    const editId = form.dataset.editId;

    const addressData = {
        fullName: document.getElementById('addrName').value,
        mobile: document.getElementById('addrMobile').value,
        houseName: document.getElementById('addrHouse').value,
        city: document.getElementById('addrCity').value,
        state: document.getElementById('addrState').value, 
        pincode: document.getElementById('addrPincode').value,
        type: document.getElementById('addrType').value || "Home"
    };
    console.log(addressData)
    try {
        let response;
        if (editId) {
           
            response = await axios.patch(`/user/address/update/${editId}`, addressData);
        } else {
            
            response = await axios.patch('/user/address/add', addressData);
        }
        if (response.data.success) {
            alert(editId ? 'Address updated successfully!' : 'Address added successfully!');
            delete form.dataset.editId;
            document.querySelector('#addressModal h3').innerText = "Add New Address";
            location.reload(); 
        }
    } catch (error) {
        console.error('Error:', error);
        alert(error.response?.data?.message || 'Failed to save address');
    }
}