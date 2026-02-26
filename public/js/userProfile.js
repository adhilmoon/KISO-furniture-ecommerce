
let isEditMode = false;
let originalData = {};


window.addEventListener('DOMContentLoaded', function () {
    originalData = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value
    };
});


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

    if(!file.type.startsWith('image/')) {
        showMessage('Please select a valid image file', 'error');
        return;
    }


    if(file.size > 5 * 1024 * 1024) {
        showMessage('Image size should be less than 5MB', 'error');
        return;
    }


    const reader = new FileReader();
    reader.onload = function (e) {
        const previewImg = document.getElementById('profilePreview');
        const avatarLetter = document.getElementById('avatarLetter');


        previewImg.src = e.target.result;
        previewImg.classList.remove('hidden');

        if(avatarLetter) {
            avatarLetter.classList.add('hidden');
        }
    };
    reader.readAsDataURL(file);


    const formData = new FormData();
    formData.append('profileImage', file);

    axios.patch('/user/profile/image', formData, {
        headers: {'Content-Type': 'multipart/form-data'}
    })
        .then(response => {
            showMessage(response.data.message || 'Profile picture updated successfully!', 'success');

            const navprofileImgContainer = document.getElementById('nav-profile-img')


            const newUrl = response.data.avatar;
            if(navprofileImgContainer && newUrl) {
                navprofileImgContainer.innerHTML = `<img src="${newUrl}" alt="Profile" class="w-full h-full object-cover">`

            }

            toggleEditMode();
        })
        .catch(error => {
            showMessage(error.response?.data?.message || 'Failed to upload image', 'error');
        });
}


async function handleProfileUpdate(event) {
    event.preventDefault();

    const formData = {
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim()
    };



    if(formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
        showMessage('Enter a valid 10-digit phone number', 'error')
        return;
    }
    if(!formData.name) {
        showMessage('Name is required', 'error');
        return;
    }

    try {
        const response = await axios.patch('/user/update-profile', formData);

        if(response.data.success) {
            showMessage(response.data.message || 'Profile updated successfully!', 'success');
            const navprofileImgContainer = document.getElementById('nav-profile-img')
            const newName = formData.name;
            const avatarLetter=document.getElementById('avatarLetter');
            if(avatarLetter){
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


function showMessage(msg, type) {
    const el = document.getElementById('profile-message');
    el.textContent = msg;
    el.className = `text-center min-h-[20px] font-medium text-sm ${type === 'success' ? 'text-green-600' : 'text-red-600'}`;
    setTimeout(() => {
        el.textContent = '';
        el.className = 'text-center min-h-[20px] font-medium text-sm';
    }, 3000);
}


