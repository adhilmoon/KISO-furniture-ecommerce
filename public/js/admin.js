function togglePassword() {
    const passwordInput = document.getElementById('password');
    const eyeOpen = document.getElementById('eyeOpen');
    const eyeClosed = document.getElementById('eyeClosed');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        
        eyeOpen.style.display = 'none';
        eyeClosed.style.display = 'block';
        eyeClosed.classList.remove('hidden'); 
    } else {
        passwordInput.type = 'password';
     
        eyeOpen.style.display = 'block';
        eyeClosed.style.display = 'none';
    }
}