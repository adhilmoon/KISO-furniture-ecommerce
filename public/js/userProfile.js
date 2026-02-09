
    let isEditMode = false;
    let originalData = {
        name: '<%= user.name %>',
        phone: '<%= user.phone || "" %>'
    };

    // Toggle Edit Mode
    function toggleEditMode() {
        isEditMode = !isEditMode;
        
        const nameInput = document.getElementById('name');
        const phoneInput = document.getElementById('phone');
        const actions = document.getElementById('formActions');
        const editBtn = document.getElementById('toggleEditBtn');
        const imgOverlay = document.getElementById('imageUploadLabel');
        const addPhoneBtn = document.getElementById('addPhoneBtn');

        if (isEditMode) {
            // Enable Editing
            nameInput.disabled = false;
            phoneInput.disabled = false;
            actions.classList.remove('hidden');
            actions.classList.add('flex');
            
            // Hide Edit button
            editBtn.classList.add('hidden');
            
            // Show Image Upload Overlay
            if (imgOverlay) {
                imgOverlay.classList.remove('hidden');
            }

            // Show add phone button if no phone
            if (addPhoneBtn) {
                addPhoneBtn.classList.remove('hidden');
            }
            
            // Focus on name
            nameInput.focus();
        } else {
            // Disable Editing
            nameInput.disabled = true;
            phoneInput.disabled = true;
            actions.classList.add('hidden');
            actions.classList.remove('flex');
            
            // Show Edit button
            editBtn.classList.remove('hidden');
            
            // Hide Image Upload Overlay
            if (imgOverlay) {
                imgOverlay.classList.add('hidden');
            }
            
            // Hide add phone button
            if (addPhoneBtn) {
                addPhoneBtn.classList.add('hidden');
            }
        }
    }

    // Cancel Edit and Restore Original Data
    function cancelEdit() {
        document.getElementById('name').value = originalData.name;
        document.getElementById('phone').value = originalData.phone;
        toggleEditMode();
    }

    // Copy Referral Code
    function copyReferralCode() {
        const codeText = document.getElementById('referralCode').value;
        navigator.clipboard.writeText(codeText).then(() => {
            showMessage('Referral code copied to clipboard!', 'success');
        }).catch(() => {
            showMessage('Failed to copy code', 'error');
        });
    }

    // Handle Profile Image Change
    function handleProfileImageChange(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showMessage('Please select a valid image file', 'error');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showMessage('Image size should be less than 5MB', 'error');
            return;
        }

        // Preview image
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewImg = document.getElementById('profilePreview');
            const avatarLetter = document.getElementById('avatarLetter');
            
            previewImg.src = e.target.result;
            previewImg.classList.remove('hidden');
            
            if (avatarLetter) {
                avatarLetter.classList.add('hidden');
            }
        };
        reader.readAsDataURL(file);

        // Upload to server
        const formData = new FormData();
        formData.append('profileImage', file);

        axios.patch('/user/upload-profile-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        .then(response => {
            showMessage(response.data.message || 'Profile picture updated successfully!', 'success');
        })
        .catch(error => {
            showMessage(error.response?.data?.message || 'Failed to upload image', 'error');
        });
    }

    // Handle Profile Update
    async function handleProfileUpdate(event) {
        event.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value.trim(),
            phone: document.getElementById('phone').value.trim()
        };

        // Validation

        if(formData.phone&&!/^[0-9]{10}$/.test(formData.phone)){
            showMessage('Enter a valid 10-digit phone number', 'error')
            return;
        }
        if (!formData.name) {
            showMessage('Name is required', 'error');
            return;
        }

        try {
            const response = await axios.patch('/user/update-profile', formData);
            
            if (response.data.success) {
                showMessage(response.data.message || 'Profile updated successfully!', 'success');
                
                // Update original data
                originalData.name = formData.name;
                originalData.phone = formData.phone;
                
                // Exit edit mode
                toggleEditMode();
            }
        } catch (error) {
            showMessage(error.response?.data?.message || 'Failed to update profile', 'error');
        }
    }

    // Show Message Helper
    function showMessage(msg, type) {
        const el = document.getElementById('profile-message');
        el.textContent = msg;
        el.className = `text-center min-h-[20px] font-medium text-sm ${type === 'success' ? 'text-green-600' : 'text-red-600'}`;
        setTimeout(() => {
            el.textContent = '';
            el.className = 'text-center min-h-[20px] font-medium text-sm';
        }, 3000);
    }
