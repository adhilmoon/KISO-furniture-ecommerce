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

                // Update data-status attribute for potential filtering
                row.setAttribute('data-status', response.data.isBlocked ? 'blocked' : 'active');

                const statusCell = row.querySelectorAll('td')[5];
                if(statusCell) {
                    statusCell.innerHTML = response.data.isBlocked
                        ? `<span class="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-xs font-semibold tracking-wide">Blocked</span>`
                        : `<span class="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-semibold tracking-wide">Active</span>`;
                }

                const actionBtn = document.getElementById(`action-btn-${userId}`);
                if(actionBtn) {
                    if(response.data.isBlocked) {
                        actionBtn.textContent = 'Activate';
                        actionBtn.className = "px-5 py-2 rounded-lg text-xs font-semibold transition-colors shadow-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 shadow-green-500/10";
                    } else {
                        actionBtn.textContent = 'Block';
                        actionBtn.className = "px-5 py-2 rounded-lg text-xs font-semibold transition-colors shadow-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 flex-shrink-0 shadow-red-500/10";
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


