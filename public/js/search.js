function debounce(callback, delay) {
  let timeoutId;
  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback.apply(this, args), delay);
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(dateValue) {
  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }
  return parsedDate.toISOString().split("T")[0];
}

(function initAdminSearch() {
  const searchInput = document.getElementById("searchInput");
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  const tableBody = document.getElementById("usersTableBody");
  const statusFilter = document.getElementById("statusFilter");
  const pagination = document.getElementById("usersPagination");

  if (!tableBody) {
    return;
  }

  const initialTableHtml = tableBody.innerHTML;
  let activeStatus = statusFilter ? statusFilter.value : "all";
  let searchedUsers = null;

  function getUserStatus(user) {
    if (user.isBlocked) {
      return "Blocked";
    }
    return user.isActive ? "Active" : "Inactive";
  }

  function isStatusMatch(status) {
    if (activeStatus === "all") {
      return true;
    }
    return status.toLowerCase() === activeStatus;
  }

  function getStatusBadge(status) {
    if (status === "Blocked") {
      return '<span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Blocked</span>';
    }
    if (status === "Inactive") {
      return '<span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Inactive</span>';
    }
    return '<span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>';
  }

  function getActionButton(userId, isBlocked) {
    const safeId = escapeHtml(userId);
    if (isBlocked) {
      return `<button id="action-btn-${safeId}" onclick="toggleBlock('${safeId}')" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">Activate</button>`;
    }
    return `<button id="action-btn-${safeId}" onclick="toggleBlock('${safeId}')" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">Block</button>`;
  }

  function renderUsers(users) {
    const filteredUsers = users.filter((user) => isStatusMatch(getUserStatus(user)));

    if (!filteredUsers.length) {
      tableBody.innerHTML =
        '<tr data-empty-row="true"><td colspan="7" class="px-6 py-8 text-center text-sm text-gray-500">No users found.</td></tr>';
      return;
    }

    tableBody.innerHTML = filteredUsers
      .map((user, index) => {
        const name = escapeHtml(user.name || "Unknown");
        const email = escapeHtml(user.email || "-");
        const userId = escapeHtml(user._id || "");
        const userCode = escapeHtml(user.userId || 10000 + index);
        const initial = escapeHtml((user.name || "U").charAt(0).toUpperCase());
        const status = getUserStatus(user);
        const joinedDate = formatDate(user.createdAt);
        const orderCount = Number(user.ordercount ?? user.orderCount ?? 0);

        return `
          <tr class="hover:bg-gray-50 transition-colors user-row" data-user-id="${userId}" data-status="${status.toLowerCase()}" data-name="${name.toLowerCase()}" data-email="${email.toLowerCase()}">
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm font-medium text-gray-900">#${userCode}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="w-10 h-10 rounded-full bg-[#8B7355] flex items-center justify-center text-white font-bold text-sm mr-3">${initial}</div>
                <div>
                  <p class="text-sm font-medium text-gray-900">${name}</p>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm text-gray-600">${email}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm text-gray-600">${joinedDate}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm font-medium text-gray-900">${orderCount}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              ${getStatusBadge(status)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              ${getActionButton(userId, user.isBlocked)}
            </td>
          </tr>
        `;
      })
      .join("");
  }

  function applyStatusFilterToCurrentRows() {
    const rows = Array.from(tableBody.querySelectorAll("tr.user-row"));

    rows.forEach((row) => {
      const rowStatus = row.dataset.status || "";
      const isVisible = activeStatus === "all" || rowStatus === activeStatus;
      row.style.display = isVisible ? "" : "none";
    });

    const hasVisibleRows = rows.some((row) => row.style.display !== "none");
    const emptyRow = tableBody.querySelector('tr[data-empty-row="true"]');

    if (!hasVisibleRows && rows.length) {
      if (!emptyRow) {
        tableBody.insertAdjacentHTML(
          "beforeend",
          '<tr data-empty-row="true"><td colspan="7" class="px-6 py-8 text-center text-sm text-gray-500">No users found.</td></tr>'
        );
      }
      return;
    }

    if (emptyRow) {
      emptyRow.remove();
    }
  }

  function togglePagination(show) {
    if (!pagination) {
      return;
    }
    pagination.style.display = show ? "" : "none";
  }

  function updateClearButtonVisibility(value) {
    if (!clearSearchBtn) {
      return;
    }
    if (value.trim()) {
      clearSearchBtn.classList.remove("hidden");
      return;
    }
    clearSearchBtn.classList.add("hidden");
  }

  async function handleSearch(query) {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      searchedUsers = null;
      tableBody.innerHTML = initialTableHtml;
      togglePagination(true);
      applyStatusFilterToCurrentRows();
      return;
    }

    try {
      const response = await axios.get("/admin/users/search", {
        params: { q: trimmedQuery },
      });
      searchedUsers = Array.isArray(response.data?.users)
        ? response.data.users
        : [];
      renderUsers(searchedUsers);
      togglePagination(false);
    } catch (error) {
      console.error("Search error:", error);
    }
  }

  const debouncedSearch = debounce(() => {
    if (!searchInput) {
      return;
    }
    handleSearch(searchInput.value);
  }, 400);

  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      updateClearButtonVisibility(event.target.value);
      debouncedSearch();
    });
  }

  if (clearSearchBtn && searchInput) {
    clearSearchBtn.addEventListener("click", () => {
      searchInput.value = "";
      updateClearButtonVisibility("");
      handleSearch("");
      searchInput.focus();
    });
  }

  window.filterUsers = function filterUsers() {
    activeStatus = statusFilter ? statusFilter.value : "all";

    if (searchedUsers !== null) {
      renderUsers(searchedUsers);
      return;
    }

    applyStatusFilterToCurrentRows();
  };

  updateClearButtonVisibility(searchInput ? searchInput.value : "");
  applyStatusFilterToCurrentRows();
})();
