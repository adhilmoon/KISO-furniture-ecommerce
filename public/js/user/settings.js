const emailModal = document.getElementById('emailModal');
const updateEmailForm = document.getElementById('updateEmailForm');
const updatePasswordForm = document.getElementById('changePasswordForm');
const togglePasswordBtn = document.getElementById('togglePasswordForm');
const cancelPasswordBtn = document.getElementById('cancelPasswordChange');
const passError = document.getElementById('pass-error');
const emailModalError = document.getElementById('emailModal-error');

const PASS_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clearEmailModalError() {
    if (emailModalError) emailModalError.innerText = '';
}

function setPassError(msg) {
    if (passError) passError.innerText = msg || '';
}

function showEmailModal() {
    emailModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    clearEmailModalError();
}

function hideEmailModal() {
    emailModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    clearEmailModalError();
    updateEmailForm?.reset();
}

function togglePasswordVisibility() {
    const isChecked = document.getElementById('showPasswordToggle').checked;
    const type = isChecked ? 'text' : 'password';
    document.getElementById('currentPassword').type = type;
    document.getElementById('newPassword').type = type;
}

if (togglePasswordBtn && updatePasswordForm) {
    togglePasswordBtn.addEventListener('click', () => {
        const isHidden = updatePasswordForm.classList.toggle('hidden');
        togglePasswordBtn.textContent = isHidden ? 'Change Password' : 'Hide';
        if (isHidden) {
            updatePasswordForm.reset();
            setPassError('');
        }
    });
}

if (cancelPasswordBtn && updatePasswordForm) {
    cancelPasswordBtn.addEventListener('click', () => {
        updatePasswordForm.classList.add('hidden');
        updatePasswordForm.reset();
        setPassError('');
        if (togglePasswordBtn) togglePasswordBtn.textContent = 'Change Password';
    });
}

updateEmailForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('newEmail').value.trim();
    const password = document.getElementById('confirmPassword').value.trim();

    if (!email) return showToast('Please enter an email', 'error');
    if (!EMAIL_REGEX.test(email)) return showToast('Please enter a valid email', 'error');
    if (!password) return showToast('Please enter your password', 'error');

    try {
        const response = await axios.patch('/user/update-email', { email, password });
        if (response.data.success) {
            showOTPModal({
                email,
                purpose: 'update-email',
                remainingSeconds: response.data.remainingSeconds,
                ttlSeconds: response.data.ttlSeconds
            });
            hideEmailModal();
        }
    } catch (error) {
        const msg = error.response?.data?.message || 'Failed to update email';
        showToast(msg, 'error');
    }
});

updatePasswordForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;

    if (!currentPassword || !newPassword) {
        setPassError('Please enter both passwords');
        return;
    }
    if (!PASS_REGEX.test(newPassword)) {
        setPassError('Password must be 8+ chars with upper, lower, number, and symbol');
        return;
    }
    setPassError('');

    try {
        const response = await axios.patch('/user/change-password', { currentPassword, newPassword });
        if (response.data.redirectUrl) {
            if (response.data.message) showToast(response.data.message, 'success');
            updatePasswordForm.reset();
            setTimeout(() => window.location.replace(response.data.redirectUrl), 1200);
            return;
        }
        if (response.data.success) {
            showToast(response.data.message || 'Password changed successfully', 'success');
            updatePasswordForm.reset();
            updatePasswordForm.classList.add('hidden');
            if (togglePasswordBtn) togglePasswordBtn.textContent = 'Change Password';
        }
    } catch (error) {
        const msg = error.response?.data?.message || 'Failed to change password';
        setPassError(msg);
        showToast(msg, 'error');
    }
});
