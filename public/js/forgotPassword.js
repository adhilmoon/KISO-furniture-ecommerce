
document.addEventListener("DOMContentLoaded", () => {
    const forgotLink = document.getElementById("forgotPasswordLink");

    if (forgotLink) {
        forgotLink.addEventListener("click", handleForgotPassword);
    }
});
async function handleForgotPassword(event) {
    event.preventDefault()
     console.log("Forgot password clicked");
   
    const emailInput = document.getElementById('email');
    const email = emailInput.value.trim();
    const errorDisplay = document.getElementById('local-error');
     errorDisplay.innerText = "";
     errorDisplay.style.color = "";

    const showError = (msg) => {
        errorDisplay.innerText = msg;
        errorDisplay.style.color = "red";
        return false;
    }

    if(!email) {
       showError("Please enter your email");
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)) {
      showError('Please enter a valid email address')
        return
    }

    try {
        const response = await axios.post('/user/forgot-password', {email});

        if(response.data.success) {
          showOTPModal()

        }
    } catch(error) {
        const message = error.response?.data?.message || "Something went wrong";
        errorDisplay.innerText = message;
    }
}



function toggleResetPasswordVisibility() {
    const toggle = document.getElementById('showResetPasswordToggle');
    const newPasswordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    if(!toggle || !newPasswordInput || !confirmPasswordInput) return;

    const inputType = toggle.checked ? 'text' : 'password';
    newPasswordInput.type = inputType;
    confirmPasswordInput.type = inputType;
}

async function handleResetPassword(event) {
    event.preventDefault();

    const newPassword = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    const errorDisplay = document.getElementById('reset-error');
    errorDisplay.innerText = "";

    if(!newPassword || !confirmPassword) {
        errorDisplay.innerText = "Please fill in all fields";
        return;
    }

    if(newPassword !== confirmPassword) {
        errorDisplay.innerText = "Passwords do not match";
        return;
    }

    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

    if(!passRegex.test(newPassword)) {
        errorDisplay.innerText = "Password must be 8+ chars with uppercase, lowercase, number & special char";
        return;
    }

    try {
        const response = await axios.patch('/user/reset-password', {password: newPassword});

        if(response.data.success) {
            alert("Password reset successfully!");
            window.location.href = '/user/login';
        }
    } catch(error) {
        errorDisplay.innerText = error.response?.data?.message || "Failed to reset password";
    }
}

