

function validation (event){
    const email = document.getElementById('email')
    const pass = document.getElementById('password')
    const errorDisplay= document.getElementById('local-error')

    errorDisplay.innerText="";
    if(email.trim()===""&& pass.trim()===""){
        event.preventDefault()
        errorDisplay.innerText='pleas fill all the fields'
        return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)){
        event.preventDefault()
        errorDisplay.innerText='Enter valid email address';
        return false;
    }
}