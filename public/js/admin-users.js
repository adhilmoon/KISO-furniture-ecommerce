async function toggleBlock(userId) {
    try {
        const response = await axios.patch(`/admin/user/${userId}/block`);
        if (response.data.success) {
            const row = document.querySelector(`tr[data-user-id='${userId}']`);
            if (row) {
              
                const statusCell = row.querySelectorAll('td')[5]; 
                if (statusCell) {
                    statusCell.innerHTML = response.data.isBlocked
                        ? `<span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Blocked</span>`
                        : `<span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>`;
                }

                
                const actionBtn = document.getElementById(`action-btn-${userId}`);
                if (actionBtn) {
                    if (response.data.isBlocked) {
                        // user is now blocked — show action to activate
                        actionBtn.textContent = 'Activate';
                        actionBtn.className = "px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition";
                    } else {
                        // user is now active — show action to block
                        actionBtn.textContent = 'Block';
                        actionBtn.className = "px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition";
                    }
                }
            }
        } else {
            alert(response.data.message || 'Failed to update user status');
        }
    } catch (err) {
        console.error(err);
        alert('Server error while updating status');
    }
}


