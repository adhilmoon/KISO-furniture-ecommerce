
async function handleLogout() {
    
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
    try {
        const response = await axios.get('/admin/logout');
        
        if(response.data.success) {
            // Clear session/auth data from frontend
            localStorage.removeItem('admin');
            sessionStorage.removeItem('admin');
            
            // Show success message
            alert('Logged out successfully!');
            
            // Redirect to admin login page
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

