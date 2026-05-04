document.addEventListener('DOMContentLoaded', () => {
    const payNowBtn = document.getElementById('payNowBtn');

    if (payNowBtn) {
        payNowBtn.addEventListener('click', async () => {
            const amount = payNowBtn.dataset.amount;
            const razorpayKey = payNowBtn.dataset.razorpayKey;

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
                    image: "/images/logo.png", // Ensure you have a logo or use a placeholder
                    order_id: order.id,
                    handler: async function (response) {
                        try {
                            // Show verifying state
                            payNowBtn.innerHTML = `<svg class="animate-spin h-5 w-5 text-brand-bg1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Verifying...`;

                            // 3. Verify Payment on Backend
                            const verifyResponse = await axios.post('/user/payment/verify', {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            });

                            if (verifyResponse.data.success) {
                                if (window.showToast) showToast('Order placed successfully!', 'success');
                                
                                // Redirect to success page or profile/orders
                                setTimeout(() => {
                                    window.location.href = '/user/profile?order=success';
                                }, 1500);
                            } else {
                                throw new Error('Payment verification failed');
                            }
                        } catch (error) {
                            console.error('Verification Error:', error);
                            if (window.showToast) showToast(error.message || 'Verification failed', 'error');
                            payNowBtn.disabled = false;
                            payNowBtn.innerHTML = originalContent;
                        }
                    },
                    prefill: {
                        name: "", // You can pass user data here if available in window.user
                        email: "",
                        contact: ""
                    },
                    theme: {
                        color: "#EAB308" // Brand Accent Color
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
                    if (window.showToast) showToast('Payment failed: ' + response.error.description, 'error');
                    payNowBtn.disabled = false;
                    payNowBtn.innerHTML = originalContent;
                });

                rzp1.open();

            } catch (error) {
                console.error('Payment Error:', error);
                if (window.showToast) showToast(error.response?.data?.message || error.message || 'Payment failed', 'error');
                payNowBtn.disabled = false;
                payNowBtn.innerHTML = `Pay with Razorpay <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>`;
            }
        });
    }
});
