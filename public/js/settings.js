


const emailModal = document.getElementById('emailModal');
const updateEmailForm = document.getElementById('updateEmailForm')
const updatePasswrodForm=document.getElementById('changePasswordForm')
 const errorDisplay=document.getElementById('emailModal-error')


function showEmailModal() {
    emailModal.classList.remove('hidden')
    document.body.style.overflow = 'hidden';
    errorDisplay.innerText=""

}

function hideEmailModal() {
    emailModal.classList.add('hidden')
    document.body.style.overflow = 'auto';
    errorDisplay.innerText=""
    updateEmailForm.reset();
}

updateEmailForm.addEventListener('submit',async(e)=>{
    e.preventDefault();
    const inputemail= document.getElementById('newEmail')
    const password = document.getElementById('confirmPassword').value;
    errorDisplay.innerText='';
    const email=inputemail.value.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!email){
       errorDisplay.innerText="pleas enter email";
       return
    }
    if(!emailRegex.test(email)) {
        errorDisplay.innerText="pleas enter valid email";
       return
    }
    try {
         const response=await axios.patch('/user/update-email',{email,password})
         if(response.data.success){
            showOTPModal()
            hideEmailModal()
         }
    } catch (error) {
        console.log('updateemailform error')
    }

})
updatePasswrodForm.addEventListener('submit',async(e)=>{
    e.preventDefault()
    const currentPassword=document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const errorDisplay=document.getElementById('pass-error')
    errorDisplay.innerText=""
     const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
     if(!newPassword||!currentPassword){
        errorDisplay.style.color="red" ;
        errorDisplay.innerText="pleas enter both password";
        return   
     }
     if(!passRegex.test(newPassword)) {
        errorDisplay.style.color="red" ;
       errorDisplay.innerText="pleas enter valid  password";
       return    
    }
    try {
        const response=await axios.patch('/user/change-password',{currentPassword,newPassword})
        if(response.data.success){
             errorDisplay.style.color="green";
             errorDisplay.innerText="password changed  successfully" 
             updatePasswrodForm.reset()
             setTimeout(()=>{
                window.location.reload()
             },300)
             
        }
    } catch (error) {
        consoler.log('passwrod changing error')
        errorDisplay.style.color = "red";
        errorDisplay.innerText = error.response?.data?.message || "Failed to change password";
    }
})



function togglePasswordVisibility(){
    const isChecked=document.getElementById('showPasswordToggle').checked;

    const currentPassInput=document.getElementById('currentPassword')
    const newPassInput=document.getElementById('newPassword')
    if(isChecked){
        currentPassInput.type="text";
        newPassInput.type="text"
    }else{
         currentPassInput.type="password";
        newPassInput.type="password"
    }
}