
  const ORDER_ID = '<%= order._id %>';

  function showToast(message, success) {
    var toast      = document.getElementById('toast');
    var toastInner = document.getElementById('toastInner');
    var toastMsg   = document.getElementById('toastMsg');
    var toastIcon  = document.getElementById('toastIcon');

    toastMsg.textContent = message;

    if (success) {
      toastInner.className = 'flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-semibold bg-green-500/10 text-green-400 border-green-500/20';
      toastIcon.innerHTML  = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>';
    } else {
      toastInner.className = 'flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-semibold bg-red-500/10 text-red-400 border-red-500/20';
      toastIcon.innerHTML  = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>';
    }

    toast.classList.remove('hidden');
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(function() {
      toast.classList.add('hidden');
    }, 3500);
  }

  function updateOrderStatus() {
    var btn    = document.getElementById('updateStatusBtn');
    var select = document.getElementById('statusSelect');
    var status = select.value;

    btn.disabled    = true;
    btn.textContent = 'Updating...';

    axios.patch('/admin/orders/' + ORDER_ID + '/status', { status: status })
      .then(function(res) {
        showToast(res.data.message || 'Status updated successfully', true);
        setTimeout(function() { window.location.reload(); }, 1200);
      })
      .catch(function(err) {
        var msg = err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : 'Failed to update status';
        showToast(msg, false);
      })
      .finally(function() {
        btn.disabled    = false;
        btn.textContent = 'Update Status';
      });
  }

  function markCODPaid() {
    var btn = document.getElementById('markPaidBtn');
    btn.disabled    = true;
    btn.textContent = 'Updating...';
    axios.patch('/admin/orders/' + ORDER_ID + '/mark-paid')
      .then(function(res) {
        showToast(res.data.message || 'Payment marked as paid', true);
        setTimeout(function() { window.location.reload(); }, 1200);
      })
      .catch(function(err) {
        var msg = err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : 'Failed to update payment';
        showToast(msg, false);
        btn.disabled    = false;
        btn.textContent = 'Mark as Paid';
      });
  }

  function approveReturn() {
    var btn = document.getElementById('approveReturnBtn');
    btn.disabled    = true;
    btn.textContent = 'Approving...';
    axios.patch('/admin/orders/' + ORDER_ID + '/approve-return')
      .then(function(res) {
        showToast(res.data.message || 'Return approved', true);
        setTimeout(function() { window.location.reload(); }, 1200);
      })
      .catch(function(err) {
        var msg = err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : 'Failed to approve return';
        showToast(msg, false);
        btn.disabled    = false;
        btn.textContent = 'Approve Return & Refund';
      });
  }
