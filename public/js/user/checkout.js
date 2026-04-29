document.getElementById('btnContinueToPayment').addEventListener('click', async () => {
    const selectedAddress = document.querySelector('input[name="selectedAddress"]:checked');
    const confirmMessage = 'Please select a delivery address to proceed.';

    if (!selectedAddress) {
        await confirmAction(confirmMessage, 'info');
        return;
    }

    const addressId = selectedAddress.value;
    window.location.href = `/checkout/payment?addressId=${addressId}`;
});

