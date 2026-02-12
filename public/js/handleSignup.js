


let timerInterval;
function startTimer() {
    let timeLeft = 120;
    const timerDisplay = document.getElementById('timer');
    const resendBtn = document.getElementById('resendBtn');
    const timerContainer = document.getElementById('timerContainer');

    clearInterval(timerInterval);
    if(resendBtn) resendBtn.classList.remove('hidden');
    if(timerContainer) timerContainer.classList.remove('hidden');

    timerInterval = setInterval(() => {
        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;

        timerDisplay.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if(timeLeft <= 0) {
            clearInterval(timerInterval);
            timerDisplay.innerText = "00:00";
        }
        timeLeft--;
    }, 1000);
}


function showOTPModal() {
    document.getElementById('otpModal').classList.remove('hidden');
    const modalError = document.getElementById('modal-error');
    modalError.innerText = "";
    modalError.classList.remove('text-red-500', 'text-green-500');
    startTimer();
}

async function signup_handle(event) {
    event.preventDefault()
    const name = document.getElementById('name').value.trim()
    const email = document.getElementById('email').value.trim()
    const password = document.getElementById('password').value.trim()
    const confirmPassword = document.getElementById('confirmPassword').value.trim()
    const errorDisplay = document.getElementById('local-error')
    const referralCode = document.getElementById('referralCode').value.trim();

    errorDisplay.innerText = "";
    errorDisplay.classList.remove('text-green-500', 'text-red-500');
    const showError = (msg) => {
        errorDisplay.innerText = msg;
        errorDisplay.classList.add('text-red-500');
        return false
    }
    if(!password || !name || !email || !confirmPassword) {
        return showError("Please fill all fields");
    }
    if(password !== confirmPassword) {
        return showError("Passwords do not match");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if(!emailRegex.test(email)) {
        event.preventDefault();
        return showError('Please enter a valid email address');
    }
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

    if(!passRegex.test(password)) {
        event.preventDefault();
        return showError('Password must be 8+ chars with uppercase, lowercase & number');
    }
    if(name.length > 20) {
        return showError("Name cannot exceed 20 characters");
    }
    try {
        const response = await axios.post('/user/signup', {email, password, name, referralCode});
        if(response.data.success) {
            showOTPModal()
            errorDisplay.innerText = response.data.message;
            errorDisplay.classList.add('text-green-500');
        }

    } catch(error) {
        errorDisplay.innerText = error.response?.data?.message || "Signup failed. Please try again.";
        errorDisplay.classList.add('text-red-500');
        console.error("Login error:", error);
    }
}
  document.getElementById('verifyBtn').addEventListener('click', () => {
       verifyOTP()
    });

async function verifyOTP() {
    const otp = document.getElementById('otpInput').value.trim();
    const modalError = document.getElementById('modal-error')
    console.log(otp)
    modalError.innerText = "";
    modalError.classList.add('hidden');

    if(!otp || otp.length !== 4) {
        modalError.innerText = "Please enter a valid 4-digit OTP";
        modalError.classList.remove('hidden');
        modalError.style.color = "red";
        return;
    }
    try {
        const response = await axios.post('/user/veryfy-otp', {otp: otp});
        if(response.data.success) {

            window.location.replace(response.data.redirectUrl || '/user/login')
        }
    } catch(error) {
        const message = error.response?.data?.message || "Invalid OTP. Please try again.";
        modalError.innerText = message;
        modalError.classList.remove('hidden');;
        modalError.style.color = "red";
        console.error("Verification Error:", error);
       
    }
}
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const checkbox = document.getElementById('showPasswordToggle');

    if(!passwordInput || !confirmPasswordInput || !checkbox) {
        console.error('Password toggle elements not found');
        return;
    }

    if(checkbox.checked) {

        passwordInput.type = 'text';
        confirmPasswordInput.type = 'text';
    } else {

        passwordInput.type = 'password';
        confirmPasswordInput.type = 'password';
    }
}

async function resendOTP() {
    const email = document.getElementById('email').value.trim();
    const name = document.getElementById('name').value.trim();
    const otpInput = document.getElementById('otpInput');
    const modalError = document.getElementById('modal-error');

    if(modalError) {
        modalError.innerText = "";
        modalError.classList.add('hidden');
        modalError.style.color = "";
        modalError.classList.remove('text-red-500', 'text-green-500');
    }

    if(otpInput) {
        otpInput.value = "";
    }


    try {
        const response = await axios.post('/user/signup', {
            email: email,
            name: name,
            isResend: true
        });

        if(response.data.success) {
            startTimer();
        }
    } catch(error) {
        const message = error.response?.data?.message || "Failed to resend OTP";
        if(modalError) {
            modalError.innerText = message;
            modalError.classList.remove('hidden');
            modalError.style.color = 'red';
        }
        console.error("Resend error", error);
    }
}
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const otpInput = document.getElementById('otpInput');

    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');


    otpInput.classList.add('border-red-400');
}