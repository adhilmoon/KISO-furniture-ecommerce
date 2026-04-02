
(function initUserManagement() {
   
    const searchInput = document.getElementById("searchInput");
    const clearSearchBtn = document.getElementById("clearSearchBtn");
    const statusFilter = document.getElementById("statusFilter");
    const tableBody = document.getElementById("usersTableBody");
    const pagination = document.getElementById("usersPagination");

   
    let state = {
        allUsers: [],        
        isSearching: false,  
        initialHtml: tableBody?.innerHTML || ""
    };

  
    const debounce = (fn, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn(...args), delay);
        };
    };

    const getStatusBadge = (user) => {
        if (user.isBlocked) return `<span class="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Blocked</span>`;
        return `<span class="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>`;
    };


    function render() {
        const filterValue = statusFilter.value.toLowerCase();
        const query = searchInput.value.toLowerCase().trim();

      
        if (!state.isSearching) {
            filterExistingRows(filterValue);
            pagination.style.display = "block";
            return;
        }

       
        pagination.style.display = "none";
        const filtered = state.allUsers.filter(user => {
            const status = user.isBlocked ? 'blocked' : 'active';
            return filterValue === 'all' || status === filterValue;
        });

        if (filtered.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-8 text-center text-gray-500">No customers found matching these criteria.</td></tr>`;
            return;
        }

        tableBody.innerHTML = filtered.map((user, idx) => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 text-sm">#${user.userId || (10000 + idx)}</td>
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <div class="w-10 h-10 rounded-full bg-[#8B7355] flex items-center justify-center text-white font-bold mr-3">
                            ${user.name.charAt(0).toUpperCase()}
                        </div>
                        <p class="text-sm font-medium text-gray-900">${user.name}</p>
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">${user.email}</td>
                <td class="px-6 py-4 text-sm text-gray-600">${new Date(user.createdAt).toISOString().split('T')[0]}</td>
                <td class="px-6 py-4 text-sm font-medium">${user.ordercount || 0}</td>
                <td class="px-6 py-4">${getStatusBadge(user)}</td>
                <td class="px-6 py-4">
                    <button onclick="toggleBlock('${user._id}')" class="px-4 py-2 rounded-lg text-white transition ${user.isBlocked ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}">
                        ${user.isBlocked ? 'Activate' : 'Block'}
                    </button>
                </td>
            </tr>
        `).join("");
    }

  
    function filterExistingRows(filterValue) {
        const rows = tableBody.querySelectorAll("tr.user-row");
        rows.forEach(row => {
            const status = row.getAttribute("data-status");
            const isVisible = filterValue === "all" || status === filterValue;
            row.style.display = isVisible ? "" : "none";
        });
    }

   
    const handleSearch = async () => {
        const query = searchInput.value.trim();
        
      
        clearSearchBtn.classList.toggle("hidden", !query);

        if (!query) {
            state.isSearching = false;
            tableBody.innerHTML = state.initialHtml;
            render();
            return;
        }

        try {
            const { data } = await axios.get(`/admin/users/search?q=${query}`);
            state.allUsers = data.users || [];
            state.isSearching = true;
            render();
        } catch (err) {
            console.error("Search failed:", err);
        }
    };

  
    searchInput.addEventListener("input", debounce(handleSearch, 400));
    statusFilter.addEventListener("change", render);
    
    clearSearchBtn.addEventListener("click", () => {
        searchInput.value = "";
        handleSearch();
    });

})();