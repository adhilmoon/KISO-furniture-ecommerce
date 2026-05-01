document.addEventListener('DOMContentLoaded', () => {
    const payNowBtn = document.getElementById('payNowBtn');

    if (payNowBtn) {
        payNowBtn.addEventListener('click', async () => {
            const amount = payNowBtn.dataset.amount;
            const razorpayKey = payNowBtn.dataset.razorpayKey;
            const addressId = payNowBtn.dataset.addressId;

            try {
                // Disable button and show loading
                payNowBtn.disabled = true;
                const originalContent = payNowBtn.innerHTML;
                payNowBtn.innerHTML = `<svg class="animate-spin h-5 w-5 text-brand-bg1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Initializing...`;

                // 1. Create Order on Backend
                const orderResponse = await axios.post('/user/payment/create-order', { amount });

                if (!orderResponse.data.success) {
                    throw new Error('Failed to create payment order');
                }

                const { order } = orderResponse.data;

                // 2. Configure Razorpay Options
                const options = {
                    key: razorpayKey,
                    amount: order.amount,
                    currency: order.currency,
                    name: "KISO Furniture",
                    description: "Order Payment",
                    order_id: order.id,
                    handler: async function (response) {
                        try {
                            // Show verifying state
                            payNowBtn.innerHTML = `<svg class="animate-spin h-5 w-5 text-brand-bg1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Verifying Payment...`;

                            // 3. Verify Payment on Backend
                            const verifyResponse = await axios.post('/user/payment/verify', {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                addressId
                            });

                            if (verifyResponse.data.success) {
                                // Redirect to order confirmation page
                                window.location.href = `/user/order/confirmation/${verifyResponse.data.orderId}`;
                            } else {
                                throw new Error(verifyResponse.data.message || 'Payment verification failed');
                            }
                        } catch (error) {
                            console.error('Verification Error:', error);
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

            } catch (error) {
                console.error('Payment Error:', error);
                const reason = encodeURIComponent(error.response?.data?.message || error.message || 'Could not initiate payment');
                window.location.href = `/user/payment/failed?reason=${reason}`;
            }
        });
    }
});
