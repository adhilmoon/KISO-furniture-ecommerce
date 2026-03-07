


const emailModal = document.getElementById('emailModal');
const updateEmailForm = document.getElementById('updateEmailForm')
const updatePasswrodForm = document.getElementById('changePasswordForm')
// const errorDisplay = document.getElementById('emailModal-error')


function showEmailModal() {
    emailModal.classList.remove('hidden')
    document.body.style.overflow = 'hidden';
    errorDisplay.innerText = ""

}

function hideEmailModal() {
    emailModal.classList.add('hidden')
    document.body.style.overflow = 'auto';
    errorDisplay.innerText = ""
    updateEmailForm.reset();
}

updateEmailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputemail = document.getElementById('newEmail')
    const password = document.getElementById('confirmPassword').value.trim();
    const email = inputemail.value.trim()
    // errorDisplay.innerText = '';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!email) {
        showToast("pleas enter email","error")
        return
    }
    if(!emailRegex.test(email)) {
        showToast("pleas enter valid email","error")
        return
    }
    if(!password){
        showToast("pleas enter valid password","error")
        return
    }
    try {
        const response = await axios.patch('/user/update-email', {email, password})
        if(response.data.success) {
            showOTPModal()
            hideEmailModal()
        }
    } catch(error) {
        console.log('updateemailform error',error)
        const serverMassage = 
        error.response?.data?.message||"server side not matching "
        showToast(serverMassage,'error')
    }

})
updatePasswrodForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;

    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if(!newPassword || !currentPassword) {
        showToast("pleas enter both password", 'error')
        return false
    }
    if(!passRegex.test(newPassword)) {

        showToast("pleas enter valid passwrod ", 'error')
        return false
    }
    try {
        const response = await axios.patch('/user/change-password', {currentPassword, newPassword})
        if(response.data.success) {
            const message=response.data.message||"password changed  successfully"
            showToast(message,"success")
            updatePasswrodForm.reset()

        }
    } catch(error) {

       const ms = 
       error.response?.data?.message || "Failed to change password";
        showToast(ms,'error')
    }
})



function togglePasswordVisibility() {
    const isChecked = document.getElementById('showPasswordToggle').checked;

    const currentPassInput = document.getElementById('currentPassword')
    const newPassInput = document.getElementById('newPassword')
    if(isChecked) {
        currentPassInput.type = "text";
        newPassInput.type = "text"
    } else {
        currentPassInput.type = "password";
        newPassInput.type = "password"
    }
}