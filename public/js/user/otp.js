


let timerInterval;
function startTimer() {
    let timeLeft = 60;
    const timerDisplay = document.getElementById('timer');
    const resendBtn = document.getElementById('resendBtn');
    const timerContainer = document.getElementById('timerContainer');

    clearInterval(timerInterval);
    if(resendBtn) resendBtn.classList.add('hidden');
    if(timerContainer) timerContainer.classList.remove('hidden');

    timerInterval = setInterval(() => {
        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;

        timerDisplay.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if(timeLeft <= 0) {
            clearInterval(timerInterval);
            timerDisplay.innerText = "00:00";

            if(resendBtn) resendBtn.classList.remove('hidden')
            if(timerContainer) timerContainer.classList.add('hidden')
        }

        timeLeft--;
    }, 1000);
}

function showOTPModal() {
    const modal = document.getElementById('otpModal');

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    const digits = document.querySelectorAll('.otp-digit');
    digits.forEach(d => d.value = '');

    startTimer();

    setTimeout(() => digits[0]?.focus(), 100);
}

function closeOTPModal() {
    const modal = document.getElementById('otpModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');

    clearInterval(timerInterval);

    document.querySelectorAll('.otp-digit').forEach(d => d.value = '');

    const submitBtn = document.querySelector('#userSignupForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign Up';
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}
async function verifyOTP() {

    const digits = document.querySelectorAll('.otp-digit');
    let otp = "";
    digits.forEach(input => otp += input.value);



    if(otp.length !== 4) {
        showToast("Please enter all 4 digits", "error")
        return;
    }

    try {
        const response = await axios.post('/user/verify-otp', {otp: otp});
        if(response.data.success) {
            if(response.data.message) showToast(response.data.message, 'success');
            setTimeout(() => {
                window.location.replace(response.data.redirectUrl || '/user/login');
            }, 800);
        }
    } catch(error) {
        const message = error.response?.data?.message || "Invalid OTP. Please try again.";
        showToast(message, "error")
    }
}
async function resendOTP() {
    const email = document.getElementById('email')?.value.trim();
    const name = document.getElementById('name')?.value.trim();

    if(!email) {
        console.error("Email not found for resend");
        return;
    }

    try {

        const response = await axios.post('/user/signup', {
            email: email,
            name: name,
            isResend: true
        });

        if(response.data.success) {

            startTimer();
            const digits = document.querySelectorAll('.otp-digit');
            digits.forEach(d => d.value = '');
            digits[0].focus();


            showToast(
                response.data.message || "OTP sent to your email",
                "success"
            )


        }
    } catch(error) {
        const msg = error.response?.data?.message || "Failed to resend";
        showToast(msg, "error")
    }
}


// otp.js

document.addEventListener('DOMContentLoaded', () => {

    function setDigitFilled(input, filled) {
        if (filled) {
            input.classList.remove('border-gray-100', 'bg-[#FAFAFA]');
            input.classList.add('border-[#A67B5B]', 'bg-brand-bg1');
        } else {
            input.classList.remove('border-[#A67B5B]', 'bg-brand-bg1');
            input.classList.add('border-gray-100', 'bg-[#FAFAFA]');
        }
    }

    function initOTPInputs() {
        const digits = document.querySelectorAll('.otp-digit');

        digits.forEach((input, i) => {

            input.addEventListener('input', () => {
                input.value = input.value.replace(/\D/g, '');
                setDigitFilled(input, !!input.value);
                if(input.value.length === 1 && i < digits.length - 1) {
                    digits[i + 1].focus();
                }
            });

            input.addEventListener('blur', () => {
                if (!input.value) setDigitFilled(input, false);
            });

            input.addEventListener('keydown', (e) => {
                if(e.key === 'Backspace') {
                    if(input.value) {
                        input.value = '';
                        setDigitFilled(input, false);
                    } else if(i > 0) {
                        digits[i - 1].focus();
                        digits[i - 1].value = '';
                        setDigitFilled(digits[i - 1], false);
                    }
                }

                if(e.key === 'ArrowLeft' && i > 0) digits[i - 1].focus();
                if(e.key === 'ArrowRight' && i < digits.length - 1) digits[i + 1].focus();
            });


            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
                pasted.split('').forEach((char, j) => {
                    if(digits[j]) digits[j].value = char;
                });

                const lastIndex = Math.min(pasted.length, digits.length - 1);
                digits[lastIndex].focus();
            });


            input.addEventListener('keypress', (e) => {
                if(input.value.length >= 1) e.preventDefault();
            });

        });
    }


    initOTPInputs();


    window.initOTPInputs = initOTPInputs;

    const verifyBtn = document.getElementById('verifyBtn');

    if(verifyBtn) {
        verifyBtn.addEventListener('click', verifyOTP);
    }
});
