


async function handleLogin(event, role) {
    event.preventDefault()
    const emailValue = document.getElementById('email').value.trim();
    const passValue = document.getElementById('password').value.trim();
    const errorDisplay = document.getElementById('local-error');


    errorDisplay.innerText = "";
    errorDisplay.style.color = "";

    const showError = (msg) => {
        errorDisplay.innerText = msg;
        errorDisplay.style.color = "red";
        return false;
    }
    const showSuccess = (msg) => {
        errorDisplay.innerText = msg;
        errorDisplay.style.color = "#22c55e";
        return false;
    }


    if(!emailValue || !passValue) {
        return showError('Please fill both Email and Password fields')
    }


    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(emailValue)) {
        return showError('Please enter a valid email address')
    }
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

    if(!passRegex.test(passValue)) {
        return showError('Password must be 8+ chars with uppercase, lowercase & number')
    }



    try {
        const url = role === 'admin' ? '/admin/login' : '/user/login';

        const response = await axios.post(url, {
            email: emailValue,
            password: passValue
        })

        if(response.data.success) {
            showSuccess('Login Successful!');


            setTimeout(() => {
                window.location.replace(response.data.redirectUrl);
            }, 500);
        } else {
            return showError(response.data.message || 'Login failed. Please try again.');
        }
    } catch(error) {
        const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
        return showError(errorMessage);
    }

}
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const eyeOpen = document.getElementById('eyeOpen');
    const eyeClosed = document.getElementById('eyeClosed');

    if(passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeOpen.classList.add('hidden');
        eyeClosed.classList.remove('hidden');
    } else {
        passwordInput.type = 'password';
        eyeOpen.classList.remove('hidden');
        eyeClosed.classList.add('hidden');
    }
}
async function openForgotModal() {
    const email = document.getElementById('email')?.value?.trim();
    const errorDisplay = document.getElementById('local-error');

    if(!email) {
        if(errorDisplay) {
            errorDisplay.innerText = 'Please enter your email address first';
            errorDisplay.style.color = 'red';
        }
        return;
    }

    try {
        const response = await axios.post('/user/forgot-password', { email });

        if(response.data.success) {
            const encodedEmail = encodeURIComponent(email);
            window.location.href = `/user/forgot-password-page?email=${encodedEmail}&sent=1`;
        }
    } catch(error) {
        if(errorDisplay) {
            errorDisplay.innerText = error.response?.data?.message || 'Failed to send reset link';
            errorDisplay.style.color = 'red';
        }
    }
}
function toggleForgotModal() {
    const modal = document.getElementById('forgotPasswordModal');
    openForgotModal()
    modal.classList.toggle('hidden');
}