


let timerInterval;
function startTimer() {
    let timeLeft = 30; 
    const timerDisplay = document.getElementById('timer');
    const resendBtn = document.getElementById('resendBtn');

    clearInterval(timerInterval);
    resendBtn.classList.add('hidden'); 

    timerInterval = setInterval(() => {
        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;
        
        timerDisplay.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if(timeLeft <= 0) {
            clearInterval(timerInterval);
            timerDisplay.innerText = "OTP Expired!"; 
            resendBtn.classList.remove('hidden'); 
        }
        timeLeft--;
    }, 1000);
}


function showOTPModal() {
    document.getElementById('otpModal').classList.remove('hidden');
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
        errorDisplay.innerText = 'Enter a valid email address';
        return false;
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

async function verifyOTP() {
    const otp = document.getElementById('otpInput').value;
    const errorDisplay = document.getElementById('local-error')
    if(!otp) {
        errorDisplay.innerText = "Please enter the OTP";
        errorDisplay.classList.add('text-red-500');
        return;
    }
    try {
        const response = await axios.post('/user/veryfy-otp', {entereOtp: otp});
        if(response.data.success) {
            window.location.href = response.data.redirectUrl || '/user/login'
        }
    } catch(error) {
        const message = error.response?.data?.message || "Invalid OTP. Please try again.";
        errorDisplay.innerText = message;
        errorDisplay.classList.add('text-red-500');
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
function toggleVerifyButton() {
    const otpInput = document.getElementById('otpInput');
    const verifyBtn = document.getElementById('verifyBtn');


    if(otpInput.value.length === 4) {
        verifyBtn.classList.remove('hidden');
    } else {
        verifyBtn.classList.add('hidden');
    }
}
async function resendOTP() {
    const email = document.getElementById('email').value.trim();
    const name = document.getElementById('name').value.trim();


    try {
        const response = await axios.post('/user/signup', {
            email: email,
            name: name,
            isResend: true
        });

        if(response.data.success) {
            otpInput.value = ""; 
            verifyBtn.classList.add('hidden');
            alert("New OTP sent to " + email);
            startTimer();
        }
    } catch(error) {
        console.error("Resend error", error);
        alert(error.response?.data?.message || "Failed to resend OTP");
    }
}
