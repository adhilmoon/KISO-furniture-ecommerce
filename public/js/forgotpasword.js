function togglePasswordVisibility() {
  const passwordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const toggle = document.getElementById('showPasswordToggle');

  if (!passwordInput || !confirmPasswordInput || !toggle) return;

  const inputType = toggle.checked ? 'text' : 'password';
  passwordInput.type = inputType;
  confirmPasswordInput.type = inputType;
}

async function handleReasetpassword(event) {
  event.preventDefault();

  const password = document.getElementById('newPassword')?.value?.trim();
  const confirmPassword = document.getElementById('confirmPassword')?.value?.trim();
  const errorDisplay = document.getElementById('reset-error');

  if (errorDisplay) errorDisplay.innerText = '';

  if (!password || !confirmPassword) {
    if (errorDisplay) errorDisplay.innerText = 'Please fill in all fields';
    return;
  }

  if (password !== confirmPassword) {
    if (errorDisplay) errorDisplay.innerText = 'Passwords do not match!';
    return;
  }

  try {
    const response = await axios.patch('/user/reset-password', { password });
    if (response.data.success) {
      alert('Password updated successfully!');
      window.location.href = '/user/login';
    }
  } catch (error) {
    if (errorDisplay) {
      errorDisplay.innerText = error.response?.data?.message || 'Failed to reset password';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('resetPasswordForm');
  if (form) {
    form.addEventListener('submit', handleReasetpassword);
  }
});