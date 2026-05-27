
document.addEventListener("DOMContentLoaded", () => {
    const forgotLink = document.getElementById("forgotPasswordLink");

    if(forgotLink) {
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
        showToast(msg, 'error')
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
            showOTPModal({
                email,
                purpose: 'forgot_password',
                remainingSeconds: response.data.remainingSeconds,
                ttlSeconds: response.data.ttlSeconds
            });
        }
    } catch(error) {
        const message = error.response?.data?.message || "Something went wrong";
        showToast(message,'error')
       
    }
}



async function handleResetPassword(event) {
    event.preventDefault();

    const newPassword = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    // const errorDisplay = document.getElementById('reset-error');
    // errorDisplay.innerText = "";

    if(!newPassword || !confirmPassword) {
        showToast("Please fill in all fields", 'error')
        return;
    }

    if(newPassword !== confirmPassword) {
        showToast("Passwords do not match", 'error')
        return;
    }

    const passRegex = /^.{6,}$/

    if(!passRegex.test(newPassword)) {
        showToast('Password must be at least 6 characters', 'error')
        return;
    }

    try {
        const response = await axios.patch('/user/reset-password', {password: newPassword});

        if(response.data.success) {
            showToast("Password reset successfully!",'success');
            setTimeout(()=>{
               window.location.href = '/user/login';
            },300)
            
        }
    } catch(error) {
        const message = error.response?.data?.message || "Failed to reset password";
        showToast(message,'error')
         setTimeout(()=>{
            window.location.href = '/user/login'
            console.error(error.message)
        },200)
    }
}

