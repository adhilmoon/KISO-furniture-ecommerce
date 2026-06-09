let timerInterval;
let currentCtx = { email: '', purpose: 'signup' };

function startTimer(secondsLeft) {
    let timeLeft = Math.max(0, parseInt(secondsLeft, 10) || 0);
    const timerDisplay = document.getElementById('timer');
    const resendBtn = document.getElementById('resendBtn');
    const timerContainer = document.getElementById('timerContainer');

    clearInterval(timerInterval);

    if (timeLeft <= 0) {
        if (timerDisplay) timerDisplay.innerText = "00:00";
        if (resendBtn) resendBtn.classList.remove('hidden');
        if (timerContainer) timerContainer.classList.add('hidden');
        return;
    }

    if (resendBtn) resendBtn.classList.add('hidden');
    if (timerContainer) timerContainer.classList.remove('hidden');

    const render = () => {
        const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        if (timerDisplay) timerDisplay.innerText = `${m}:${s}`;
    };
    render();

    timerInterval = setInterval(() => {
        timeLeft--;
        render();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (resendBtn) resendBtn.classList.remove('hidden');
            if (timerContainer) timerContainer.classList.add('hidden');
        }
    }, 1000);
}

async function showOTPModal(ctx = {}) {
    const modal = document.getElementById('otpModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    currentCtx = {
        email: ctx.email || currentCtx.email,
        purpose: ctx.purpose || 'signup'
    };

    document.querySelectorAll('.otp-digit').forEach(d => d.value = '');

    // Pull authoritative remaining time from server so refresh/reopen shows
    // real countdown rather than a fresh full timer.
    let seconds = ctx.remainingSeconds;
    try {
        const { data } = await axios.get('/user/otp/status', {
            params: { email: currentCtx.email, purpose: currentCtx.purpose }
        });
        if (data.exists && data.remainingSeconds > 0) {
            seconds = data.remainingSeconds;
        }
    } catch (_) { /* fall back to ctx.remainingSeconds */ }

    startTimer(seconds || 60);

    setTimeout(() => document.querySelectorAll('.otp-digit')[0]?.focus(), 100);
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
    let otp = '';
    digits.forEach(input => otp += input.value);

    if (otp.length !== 4) {
        showToast("Please enter all 4 digits", "error");
        return;
    }
    if (!currentCtx.email) {
        showToast("Verification context lost. Please restart.", "error");
        return;
    }

    try {
        const { data } = await axios.post('/user/verify-otp', {
            email: currentCtx.email,
            purpose: currentCtx.purpose,
            otp
        });
        if (data.success) {
            sessionStorage.removeItem('kiso_pending_signup');
            if (data.message) showToast(data.message, 'success');
            setTimeout(() => {
                window.location.replace(data.redirectUrl || '/user/login');
            }, 800);
        }
    } catch (error) {
        const message = error.response?.data?.message || "Invalid OTP. Please try again.";
        showToast(message, "error");
    }
}

async function resendOTP() {
    if (!currentCtx.email) {
        showToast("Verification context lost", "error");
        return;
    }

    try {
        if (currentCtx.purpose === 'signup') {
            const cached = sessionStorage.getItem('kiso_pending_signup');
            if (!cached) {
                showToast("Please restart signup to receive a new code.", "error");
                return;
            }
            const payload = JSON.parse(cached);
            const { data } = await axios.post('/user/signup', payload);
            if (data.success) {
                startTimer(data.remainingSeconds || 120);
                resetOtpInputs();
                showToast(data.message || "OTP resent", "success");
            }
        } else if (currentCtx.purpose === 'forgot_password') {
            const { data } = await axios.post('/user/forgot-password', { email: currentCtx.email });
            if (data.success) {
                startTimer(data.remainingSeconds || 60);
                resetOtpInputs();
                showToast(data.message || "OTP resent", "success");
            }
        } else {
            showToast("Resend not supported for this flow. Please restart.", "error");
        }
    } catch (error) {
        const msg = error.response?.data?.message || "Failed to resend";
        // 429 → server told us how long to wait; resume countdown
        const remaining = error.response?.data?.remainingSeconds;
        if (remaining) startTimer(remaining);
        showToast(msg, "error");
    }
}

function resetOtpInputs() {
    const digits = document.querySelectorAll('.otp-digit');
    digits.forEach(d => d.value = '');
    digits[0]?.focus();
}

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
                if (input.value.length === 1 && i < digits.length - 1) {
                    digits[i + 1].focus();
                }
            });

            input.addEventListener('blur', () => {
                if (!input.value) setDigitFilled(input, false);
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace') {
                    if (input.value) {
                        input.value = '';
                        setDigitFilled(input, false);
                    } else if (i > 0) {
                        digits[i - 1].focus();
                        digits[i - 1].value = '';
                        setDigitFilled(digits[i - 1], false);
                    }
                }
                if (e.key === 'ArrowLeft' && i > 0) digits[i - 1].focus();
                if (e.key === 'ArrowRight' && i < digits.length - 1) digits[i + 1].focus();
            });

            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
                pasted.split('').forEach((char, j) => {
                    if (digits[j]) digits[j].value = char;
                });
                const lastIndex = Math.min(pasted.length, digits.length - 1);
                digits[lastIndex].focus();
            });

            input.addEventListener('keypress', (e) => {
                if (input.value.length >= 1) e.preventDefault();
            });
        });
    }

    initOTPInputs();
    window.initOTPInputs = initOTPInputs;

    const verifyBtn = document.getElementById('verifyBtn');
    if (verifyBtn) verifyBtn.addEventListener('click', verifyOTP);
});
