
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

    openCropper(file)
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
    const url = URL.createObjectURL(file)
    img.src = url;

    $('cropeModal').style.display = 'flex';

    if(cropper) {cropper.destroy(); cropper = null}
    img.onload = () => {
        cropper = new Cropper(img, {
            aspectRatio: NaN,
            viewMode: 0,
            autoCropArea: 0.8,
            responsive: true,
            zoomable: true,
            scalable: true,
            cropBoxResizable: true,
            cropBoxMovable: true,
            minCropBoxWidth: 50,
            minCropBoxHeight: 50,
        });
    }
}
function closeCrop() {
    $('cropeModal').style.display = 'none';
    if(cropper) {cropper.destroy(); cropper = null}
    if(currentInput) currentInput.value = "";
}
//--Crop confirm-----------------------------------------

function confirmCrop() {

    if(!cropper) return;

    const canvas = cropper.getCroppedCanvas({width: 800, height: 800});


    canvas.toBlob((blob) => {
        if(!blob) return;

        const file = new File(
            [blob],
            `cropped-${Date.now()}-${currentIndex}.jpg`,
            {type: 'image/jpeg'}
        );
        croppedFiles.push(file);
        currentIndex++;

        if(currentIndex < imageQueue.length) {
            // More images in queue — crop next
            openCropper(imageQueue[currentIndex]);
        } else {

            if(currentVariantId !== null) {
                // Store for this variant
                if(!variantCroppedFiles[currentVariantId]) {variantCroppedFiles[currentVariantId] = [];}
                croppedFiles.forEach(f => {
                    if(variantCroppedFiles[currentVariantId].length < 3) {
                        variantCroppedFiles[currentVariantId].push(f);
                    }
                });

                const dt = new DataTransfer();
                variantCroppedFiles[currentVariantId].forEach(f => dt.items.add(f));
                currentInput.files = dt.files;

                renderPreviews(variantCroppedFiles[currentVariantId], `vImgPreview-${currentVariantId}`, false);
            }

            closeCrop();
        }
    }, 'image/jpeg', 0.92);
}

function showMessage(msg, type) {
    showToast(msg, type)
}


