
let isEditMode = false;
let originalData = {};
let cropper = null;
let currentInput = null;

window.addEventListener('DOMContentLoaded', function () {
    originalData = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value
    };
});
const $ = id => document.getElementById(id)

function toggleEditMode() {
    isEditMode = !isEditMode;

    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');
    const actions = document.getElementById('formActions');
    const editBtn = document.getElementById('toggleEditBtn');
    const imgOverlay = document.getElementById('imageUploadLabel');
    const addPhoneBtn = document.getElementById('addPhoneBtn');

    if(isEditMode) {

        nameInput.disabled = false;
        phoneInput.disabled = false;
        actions.classList.remove('hidden');
        actions.classList.add('flex');


        editBtn.classList.add('hidden');


        if(imgOverlay) {
            imgOverlay.classList.remove('hidden');
            imgOverlay.classList.add('flex')
        }


        if(addPhoneBtn) {
            addPhoneBtn.classList.remove('hidden');
        }


        nameInput.focus();
    } else {

        nameInput.disabled = true;
        phoneInput.disabled = true;
        actions.classList.add('hidden');
        actions.classList.remove('flex');


        editBtn.classList.remove('hidden');


        if(imgOverlay) {
            imgOverlay.classList.add('hidden');
            imgOverlay.classList.remove('flex')
        }


        if(addPhoneBtn) {
            addPhoneBtn.classList.add('hidden');
        }
    }
}


function cancelEdit() {
    document.getElementById('name').value = originalData.name;
    document.getElementById('phone').value = originalData.phone;
    toggleEditMode();
}


function copyReferralCode() {
    const codeText = document.getElementById('referralCode').value;
    navigator.clipboard.writeText(codeText).then(() => {
        showMessage('Referral code copied to clipboard!', 'success');
    }).catch(() => {
        showMessage('Failed to copy code', 'error');
    });
}


function handleProfileImageChange(event) {
    const file = event.target.files[0];
    if(!file) return;

    // ── File type check ───────────────────────────────────────────────────────
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if(!ALLOWED_TYPES.includes(file.type)) {
        showMessage('Invalid file type. Only JPG, PNG, and WebP images are allowed.', 'error');
        event.target.value = '';
        return;
    }

    // ── File size check (5 MB) ────────────────────────────────────────────────
    if(file.size > 5 * 1024 * 1024) {
        showMessage('Image is too large. Maximum allowed size is 5 MB.', 'error');
        event.target.value = '';
        return;
    }

    openCropper(file);
    currentInput = event.target;
}



async function handleProfileUpdate(event) {
    event.preventDefault();

    const formData = {
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value
    };



    if(formData.phone !== "" && !/^[0-9]{10}$/.test(formData.phone)) {
        showMessage('Enter a valid 10-digit phone number', 'error');
        return;
    }
    if(!formData.name) {
        showMessage('Name is required', 'error');
        return;
    }
    if(!/^[A-Za-z][A-Za-z\s'-]{0,48}[A-Za-z]$/.test(formData.name)) {
        showMessage('Name must be 2-50 characters, letters/spaces only', 'error');
        return;
    }


    try {
        const response = await axios.patch('/user/update-profile', formData);

        if(response.data.success) {
            showMessage(response.data.message || 'Profile updated successfully!', 'success');
            const navprofileImgContainer = document.getElementById('nav-profile-img')
            const newName = formData.name;
            const avatarLetter = document.getElementById('avatarLetter');
            if(avatarLetter) {
                avatarLetter.textContent = newName.charAt(0).toUpperCase();
            }

            if(navprofileImgContainer) {
                const existingImg = navprofileImgContainer.querySelector('img')

                if(!existingImg) {
                    const firstLetter = newName.charAt(0).toUpperCase();
                    navprofileImgContainer.innerHTML = `<span class="text-white font-bold text-xs leading-none">${firstLetter}</span>`
                }
            }


            originalData.name = formData.name;
            originalData.phone = formData.phone;


            toggleEditMode();
        }
    } catch(error) {
        showMessage(error.response?.data?.message || 'Failed to update profile', 'error');
    }
}

////--------////-----//////----//////
function openCropper(file) {
    const img = $('cropImage');
    const url = URL.createObjectURL(file);

    // Destroy any existing cropper first
    if(cropper) {cropper.destroy(); cropper = null;}

    // Assign onload BEFORE setting src to avoid race condition with Blob URLs
    img.onload = () => {
        cropper = new Cropper(img, {
            aspectRatio: 1,
            viewMode: 1,
            autoCropArea: 0.8,
            background: false,
            responsive: true,
            zoomable: true,
            scalable: true,
            cropBoxMovable: true,
            cropBoxResizable: true,
        });
    };

    img.src = url;
    $('cropModal').style.display = 'flex';
}
function closeCrop() {
    $('cropModal').style.display = 'none';
    if(cropper) {cropper.destroy(); cropper = null;}
    if(currentInput) currentInput.value = '';
}
//--Crop confirm-----------------------------------------

function confirmCrop() {
    if(!cropper) return;

    const canvas = cropper.getCroppedCanvas({
        width: 800,
        height: 800
    });

    canvas.toBlob(async (blob) => {
        if(!blob) return;

        const file = new File([blob], `cropped-${Date.now()}.jpg`, {
            type: 'image/jpeg'
        });

        const formData = new FormData();
        formData.append('profileImage', file);

        // Show spinner
        const spinner = document.getElementById('imageLoadingSpinner');
        if(spinner) spinner.classList.remove('hidden');

        try {
            const response = await axios.patch('/user/profile/image', formData, {
                headers: {'Content-Type': 'multipart/form-data'}
            });

            console.log("API RESPONSE:", response.data);

            const previewImg = document.getElementById('profilePreview');
            const avatarLetter = document.getElementById('avatarLetter');


            const newUrl = (response.data?.avatar || canvas.toDataURL('image/jpeg', 0.9)) + `?t=${Date.now()}`;

            if(previewImg) {
                previewImg.src = newUrl;
                previewImg.classList.remove('hidden');
            }

            if(avatarLetter) {
                avatarLetter.classList.add('hidden');
            }


            const navContainer = document.getElementById('nav-profile-img');
            if(navContainer) {
                navContainer.innerHTML = `
                    <img src="${newUrl}" class="w-full h-full object-cover">
                `;
            }

            showMessage('Profile photo updated!', 'success');
            closeCrop();
            setTimeout(() => {
                if(isEditMode) toggleEditMode();
            }, 300);

        } catch(error) {
            showMessage(error.response?.data?.message || 'Upload failed', 'error');
        } finally {
            // Hide spinner
            if(spinner) spinner.classList.add('hidden');
        }

    }, 'image/jpeg', 0.9);
}

function showMessage(msg, type) {
    showToast(msg, type)
}


