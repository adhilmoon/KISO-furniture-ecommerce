
async function signup_handle(event) {
    event.preventDefault()
    resetValidation();
    const form = event.target;
    const signupData = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value.trim(),
        confirmPassword: document.getElementById('confirmPassword').value.trim(),
        referralCode: document.getElementById('referralCode').value.trim()
    }

    // const errorDisplay = document.getElementById('local-error')




    if(!signupData.name || signupData.name.length < 3) {
        return showFieldError('name', "Full Name must be at least 3 characters");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!signupData.email || !emailRegex.test(signupData.email)) {
        return showFieldError('email', 'Please enter a valid email address')
    }
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if(!signupData.password || !passRegex.test(signupData.password)) {
        return showFieldError('password', "pleas enter valid password");
    }

    if(signupData.confirmPassword !== signupData.password) {
        return showFieldError("confirmPassword", 'Password not match pleas enter exact password ');
    }
    const {email, password, name, referralCode} = signupData;
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

function showFieldError(fieldId, message) {
    const errorEl = document.getElementById(`err-${fieldId}`);
    const inputEl = document.getElementById(fieldId);
    if(errorEl) errorEl.innerText = message;
     if (inputEl) {
        inputEl.classList.remove('focus:border-kiso-brown');
        inputEl.classList.add('border-red-500', 'ring-1', 'ring-red-500');
        inputEl.focus();
    }
}

function resetValidation() {
    document.querySelectorAll('[id^="err-"]').forEach(el => el.innerText = '')
    document.querySelectorAll('#userSignupForm input,#userSignupForm select')
    .forEach(input=>{
        input.classList.remove('border-red-500', 'ring-1', 'ring-red-500');
        input.classList.add('focus:border-kiso-brown')

    })
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

