// Handle logout with immediate UI update
async function handleLogout() {
    try {
        const response = await axios.get('/user/logout');
        
        if(response.data.success) {
            // Clear session/auth data from frontend
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');
            
            // Show success message
            alert('Logged out successfully!');
            
            // Redirect to home page
            setTimeout(() => {
                window.location.replace(response.data.redirectUrl || '/');
            }, 500);
        } else {
            alert(response.data.message || 'Logout failed. Please try again.');
        }
    } catch(error) {
        console.error("Logout Error:", error);
        alert('Logout failed. Please try again.');
    }
}

// Handle admin logout with immediate UI update
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

