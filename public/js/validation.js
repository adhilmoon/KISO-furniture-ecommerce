function Validation(event) {
    const emailValue = document.getElementById('email').value.trim();
    const passValue = document.getElementById('password').value.trim();
    const errorDisplay = document.getElementById('local-error');

    errorDisplay.innerText = ""; 
    errorDisplay.style.color = "red";
   
    if (!emailValue || !passValue) {
        event.preventDefault();
        errorDisplay.innerText = 'Please fill both Email and Password fields';
        return false;
    }

   
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
        event.preventDefault();
        errorDisplay.innerText = 'Enter a valid email address';
        return false;
    }
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

if (!passRegex.test(passValue)) {
    event.preventDefault();
    errorDisplay.innerText = 'Password must be 8+ chars with uppercase, lowercase & number';
    return false;
}
    return true; 
}