async function toggleBlock(userId) {
    const actionBtn = document.getElementById(`action-btn-${userId}`);
    const row = document.querySelector(`tr[data-user-id='${userId}']`);

    if(!row || !actionBtn) return;
    const isCurrentlyBlocked = actionBtn.textContent.trim() === "Activate"
    const confirmMessage = isCurrentlyBlocked
        ? "Are you sure you want to activate this user?"
        : "Are you sure you want to block this user?";

    const result = await confirmAction(confirmMessage);

    if(!result.isConfirmed) return;
    try {
        const response = await axios.patch(`/admin/user/${userId}/block`);
        if(response.data.success) {
            const row = document.querySelector(`tr[data-user-id='${userId}']`);
            if(row) {

                const statusCell = row.querySelectorAll('td')[6];
                if(statusCell) {
                    statusCell.innerHTML = response.data.isBlocked
                        ? `<span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Blocked</span>`
                        : `<span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>`;
                }


                const actionBtn = document.getElementById(`action-btn-${userId}`);
                if(actionBtn) {
                    if(response.data.isBlocked) {
                        actionBtn.textContent = 'Activate';
                        actionBtn.className = "px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition";
                    } else {
                        actionBtn.textContent = 'Block';
                        actionBtn.className = "px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition";
                    }
                }

            }
        } else {
            alert(response.data.message || 'Failed to update user status');
        }

        const blockedCountEl = document.getElementById('blockedUsersCount')
        const activeCountEl = document.getElementById('activeUsersCount')
        if(blockedCountEl && activeCountEl) {
            let blockedCount = parseInt(blockedCountEl.textContent)
            let activeCount = parseInt(activeCountEl.textContent)
            if(response.data.isBlocked) {
                blockedCount++;
                activeCount--;
            } else {
                blockedCount--;
                activeCount++;
            }
            blockedCountEl.textContent = blockedCount;
            activeCountEl.textContent = activeCount;
        }

    } catch(err) {
        console.error(err);
        alert('Server error while updating status');
    }
}


