


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
    if(passValue.length < 6) {
        return showError("Invalid password");
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
                window.location.href = response.data.redirectUrl || "/";
            }, 200);
            console.log(document.cookie)
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
