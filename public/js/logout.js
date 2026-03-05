
async function handleLogout() {
    const result=await confirmAction("Are you sure you want to logout?")
    if(!result.isConfirmed)return
    try {
        const response = await axios.get('/user/logout');
        
        if(response.data.success) {
            localStorage.clear();
            sessionStorage.clear();
            
           
            window.location.replace(response.data.redirectUrl || '/');
        } 
    } catch(error) {
        console.error("Logout Error:", error);
    }
}

async function handleAdminLogout() {
    const result=await confirmAction("Are you sure you want to logout?")
    if(!result.isConfirmed)return
    try {
        const response = await axios.get('/admin/logout');
        
        if(response.data.success) {
          
            localStorage.removeItem('admin');
            sessionStorage.removeItem('admin');
            
          
            
         
            setTimeout(() => {
                window.location.replace(response.data.redirectUrl || '/admin/login');
            }, 500);
        } else {
            alert(response.data.message || 'Logout failed. Please try again.');
        }
    } catch(error) {
        console.error("Logout Error:", error);
        alert('Logout failed. Please try again.');
    }
}

