const orderRoot = document.getElementById('orderDetailRoot');
const ORDER_ID = orderRoot?.dataset.orderId;

async function patchOrder(endpoint, btn, busyLabel, defaultLabel, successFallback, errorFallback) {
  if (!ORDER_ID) return;
  const originalLabel = btn.textContent;
  btn.disabled = true;
  btn.textContent = busyLabel;

  try {
    const { data } = await axios.patch(`/admin/orders/${ORDER_ID}/${endpoint}`);
    showToast(data.message || successFallback, 'success');
    setTimeout(() => window.location.reload(), 1000);
  } catch (err) {
    const msg = err.response?.data?.message || errorFallback;
    showToast(msg, 'error');
    btn.disabled = false;
    btn.textContent = defaultLabel || originalLabel;
  }
}

async function updateOrderStatus() {
  const btn = document.getElementById('updateStatusBtn');
  const status = document.getElementById('statusSelect')?.value;
  if (!status || !ORDER_ID) return;

  btn.disabled = true;
  btn.textContent = 'Updating...';

  try {
    const { data } = await axios.patch(`/admin/orders/${ORDER_ID}/status`, { status });
    showToast(data.message || 'Status updated successfully', 'success');
    setTimeout(() => window.location.reload(), 1000);
  } catch (err) {
    showToast(err.response?.data?.message || 'Failed to update status', 'error');
    btn.disabled = false;
    btn.textContent = 'Update Status';
  }
}

function markCODPaid() {
  const btn = document.getElementById('markPaidBtn');
  patchOrder('mark-paid', btn, 'Updating...', 'Mark as Paid', 'Payment marked as paid', 'Failed to update payment');
}

function approveReturn() {
  const btn = document.getElementById('approveReturnBtn');
  patchOrder('approve-return', btn, 'Approving...', 'Approve Return & Refund', 'Return approved', 'Failed to approve return');
}
