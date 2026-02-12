let resetTimerInterval;

async function handleForgotPassword(event, prefilledEmail = null) {
    if (event) event.preventDefault();

    const emailInput = document.getElementById('email');
    const emailText = document.getElementById('email-display')?.innerText?.trim();
    const email = (prefilledEmail ?? emailInput?.value ?? emailText ?? '').trim();
    const errorDisplay = document.getElementById('forgot-error');
    errorDisplay.innerText = "";
    
    if (!email) {
        errorDisplay.innerText = "Please enter your email";
        return;
    }

    if (emailInput) emailInput.value = email;
    
    try {
        const response = await axios.post('/user/forgot-password', { email });
        
        if (response.data.success) {
            document.getElementById('step1').classList.add('hidden');
            document.getElementById('step2').classList.remove('hidden');
            document.getElementById('email-display').innerText = email;
            document.getElementById('otp-error').innerText = '';
            document.getElementById('reset-error').innerText = '';
            document.getElementById('resetOtp').value = '';
            startResetTimer();
        }
    } catch (error) {
        const message = error.response?.data?.message || "Failed to send recovery code";
        const otpErrorDisplay = document.getElementById('otp-error');

        if (!document.getElementById('step1').classList.contains('hidden')) {
            errorDisplay.innerText = message;
        } else if (otpErrorDisplay) {
            otpErrorDisplay.innerText = message;
        }
    }
}

async function handleVerifyResetOtp(event) {
    event.preventDefault();
    
    const otp = document.getElementById('resetOtp').value.trim();
    const errorDisplay = document.getElementById('otp-error');
    errorDisplay.innerText = "";
    
    if (!otp || otp.length !== 4) {
        errorDisplay.innerText = "Please enter a valid 4-digit code";
        return;
    }
    
    try {
        const response = await axios.post('/user/veryfy-otp', { otp });
        
        if (response.data.success) {
            document.getElementById('step2').classList.add('hidden');
            document.getElementById('step3').classList.remove('hidden');
            clearInterval(resetTimerInterval);
        }
    } catch (error) {
        errorDisplay.innerText = error.response?.data?.message || "Invalid recovery code";
    }
}

function toggleResetPasswordVisibility() {
    const toggle = document.getElementById('showResetPasswordToggle');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmNewPassword');

    if (!toggle || !newPasswordInput || !confirmPasswordInput) return;

    const inputType = toggle.checked ? 'text' : 'password';
    newPasswordInput.type = inputType;
    confirmPasswordInput.type = inputType;
}

async function handleResetPassword(event) {
    event.preventDefault();
    
    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmPassword = document.getElementById('confirmNewPassword').value.trim();
    const errorDisplay = document.getElementById('reset-error');
    errorDisplay.innerText = "";
    
    if (!newPassword || !confirmPassword) {
        errorDisplay.innerText = "Please fill in all fields";
        return;
    }
    
    if (newPassword !== confirmPassword) {
        errorDisplay.innerText = "Passwords do not match";
        return;
    }
    
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    
    if (!passRegex.test(newPassword)) {
        errorDisplay.innerText = "Password must be 8+ chars with uppercase, lowercase, number & special char";
        return;
    }
    
    try {
        const response = await axios.patch('/user/reset-password', { password: newPassword });
        
        if (response.data.success) {
            alert("Password reset successfully!");
            window.location.href = '/user/login';
        }
    } catch (error) {
        errorDisplay.innerText = error.response?.data?.message || "Failed to reset password";
    }
}

function startResetTimer() {
    let timeLeft = 120;
    const timerDisplay = document.getElementById('reset-timer');
    
    clearInterval(resetTimerInterval);
    
    resetTimerInterval = setInterval(() => {
        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;
        
        timerDisplay.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(resetTimerInterval);
            timerDisplay.innerText = "Expired";
        }
        timeLeft--;
    }, 1000);
}

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const emailFromLogin = params.get('email');
    const otpAlreadySent = params.get('sent') === '1';

    if (emailFromLogin && otpAlreadySent) {
        const emailInput = document.getElementById('email');
        if (emailInput) emailInput.value = emailFromLogin;

        document.getElementById('step1').classList.add('hidden');
        document.getElementById('step2').classList.remove('hidden');
        document.getElementById('email-display').innerText = emailFromLogin;
        startResetTimer();
        return;
    }

    if (emailFromLogin) {
        await handleForgotPassword(null, emailFromLogin);
    }
});
