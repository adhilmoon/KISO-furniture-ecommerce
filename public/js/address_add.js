

async function handleAddressSubmit(event) {
    event.preventDefault();
    
    const addressData = {
        fullName: document.getElementById('addrName').value,
        mobile: document.getElementById('addrMobile').value,
        houseName: document.getElementById('addrHouse').value,
        city: document.getElementById('addrCity').value,
        pincode: document.getElementById('addrPincode').value
    };

    try {
        const response = await axios.post('/user/address/add', addressData);
        if (response.data.success) {
            alert('Address added successfully!');
            location.reload(); 
        }
    } catch (error) {
        console.error("Address Error:", error);
        alert('Failed to add address');
    }
}