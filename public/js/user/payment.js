document.addEventListener('DOMContentLoaded', () => {
    const payNowBtn = document.getElementById('payNowBtn');
    const payBtnLabel = document.getElementById('payBtnLabel');

    // Update button label when payment method changes
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', () => {
            if (payBtnLabel) {
                payBtnLabel.textContent = radio.value === 'cod' ? 'Place Order (COD)' : 'Pay with Razorpay';
            }
        });
    });

    if (payNowBtn) {
        payNowBtn.addEventListener('click', async () => {
            const amount = payNowBtn.dataset.amount;
            const razorpayKey = payNowBtn.dataset.razorpayKey;
            const addressId = payNowBtn.dataset.addressId;
            const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'razorpay';

            payNowBtn.disabled = true;
            const originalContent = payNowBtn.innerHTML;
            const spinnerHTML = `<svg class="animate-spin h-5 w-5 text-brand-bg1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;

            try {
                if (selectedMethod === 'cod') {
                    payNowBtn.innerHTML = `${spinnerHTML} Placing Order...`;

                    const response = await axios.post('/user/payment/cod', { addressId });

                    if (response.data.success) {
                        window.location.href = `/user/order/confirmation/${response.data.orderId}`;
                    } else {
                        throw new Error(response.data.message || 'Failed to place order');
                    }
                } else {
                    payNowBtn.innerHTML = `${spinnerHTML} Initializing...`;

                    const orderResponse = await axios.post('/user/payment/create-order', { amount });

                    if (!orderResponse.data.success) {
                        throw new Error('Failed to create payment order');
                    }

                    const { order } = orderResponse.data;

                    const options = {
                        key: razorpayKey,
                        amount: order.amount,
                        currency: order.currency,
                        name: "KISO Furniture",
                        description: "Order Payment",
                        order_id: order.id,
                        handler: async function (response) {
                            try {
                                payNowBtn.innerHTML = `${spinnerHTML} Verifying Payment...`;

                                const verifyResponse = await axios.post('/user/payment/verify', {
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    addressId
                                });

                                if (verifyResponse.data.success) {
                                    window.location.href = `/user/order/confirmation/${verifyResponse.data.orderId}`;
                                } else {
                                    throw new Error(verifyResponse.data.message || 'Payment verification failed');
                                }
                            } catch (error) {
                                const reason = encodeURIComponent(error.response?.data?.message || error.message || 'Payment verification failed');
                                window.location.href = `/user/payment/failed?reason=${reason}`;
                            }
                        },
                        prefill: {
                            name: "",
                            email: "",
                            contact: ""
                        },
                        theme: {
                            color: "#EAB308"
                        },
                        modal: {
                            ondismiss: function() {
                                payNowBtn.disabled = false;
                                payNowBtn.innerHTML = originalContent;
                            }
                        }
                    };

                    const rzp1 = new Razorpay(options);
                    rzp1.on('payment.failed', function (response) {
                        const reason = encodeURIComponent(response.error.description || 'Payment was declined by the bank');
                        window.location.href = `/user/payment/failed?reason=${reason}`;
                    });

                    rzp1.open();
                }
            } catch (error) {
                const reason = encodeURIComponent(error.response?.data?.message || error.message || 'Could not initiate payment');
                window.location.href = `/user/payment/failed?reason=${reason}`;
            }
        });
    }
});
