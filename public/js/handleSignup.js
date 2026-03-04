
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
        showToast(msg, "error")
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

            showOTPModal();

            showToast(
                response.data.message || "OTP sent to your email",
                "success"
            );

        }

    } catch(error) {
        showToast(error.response?.data?.message || "Signup failed. Please try again.", "error")

        console.error("Login error:", error);
    }
}


function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const checkbox = document.getElementById('showPasswordToggle');

    if(!passwordInput || !confirmPasswordInput || !checkbox) return

    const type = checkbox.checked ? "text" : "password";
    passwordInput.type = type;
    confirmPasswordInput.type = type;
}

