// public/js/confirm.js

window.confirmAction = function(message = "Are you sure?", type = "warning") {
    const confirmConfig = {
        title: message,
        icon: type,
        showCancelButton: true,
        confirmButtonText: "Yes",
        cancelButtonText: "Cancel",
        reverseButtons: true,
        
        // Customize appearance
        background: '#0A0A0A',
        color: '#F8F9FA',
        
        // Button styling
        confirmButtonColor: '#D4AF37',
        cancelButtonColor: '#111111',
        
        // Custom CSS
        customClass: {
            container: 'kiso-swal-container',
            popup: 'kiso-swal-popup',
            title: 'kiso-swal-title',
            icon: 'kiso-swal-icon',
            confirmButton: 'kiso-swal-confirm',
            cancelButton: 'kiso-swal-cancel',
            actions: 'kiso-swal-actions'
        },
        
        // Animations
        showClass: {
            popup: 'animate-fadeInScale'
        },
        hideClass: {
            popup: 'animate-fadeOutScale'
        },
        
        // Border radius and styling
        allowOutsideClick: false,
        allowEscapeKey: true,
        didOpen: (modal) => {
            // Additional styling after modal opens
            modal.style.borderRadius = '16px';
        }
    };
    
    return Swal.fire(confirmConfig);
};

// Optional: Add specific confirmation types
window.confirmDelete = function(itemName = "this item") {
    return confirmAction(`Are you sure you want to delete ${itemName}? This action cannot be undone.`, "error");
};

window.confirmLogout = function() {
    return confirmAction("Are you sure you want to logout?", "question");
};

window.confirmAction_Success = function(message = "Are you sure?") {
    return confirmAction(message, "success");
};

window.showLoadingModal = function(title = 'Processing...', text = 'Please wait') {
    return Swal.fire({
        title,
        text,
        background: '#0A0A0A',
        color: '#F8F9FA',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
};

window.showResultModal = function(title, html, icon = 'info', confirmButtonText = 'Great') {
    return Swal.fire({
        title,
        html,
        icon,
        background: '#0A0A0A',
        color: '#F8F9FA',
        confirmButtonColor: '#D4AF37',
        confirmButtonText,
        customClass: {
            popup: 'kiso-swal-popup',
            confirmButton: 'kiso-swal-confirm'
        }
    });
};