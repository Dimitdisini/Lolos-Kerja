/**
 * src/components/modal.js: Accessible Modal Controller
 */

export function showConfirmModal(title, message, onConfirm) {
  if (typeof document === 'undefined') return;

  const modal = document.getElementById('confirmModal');
  const titleEl = document.getElementById('confirmModalTitle');
  const msgEl = document.getElementById('confirmModalMessage');
  const confirmBtn = document.getElementById('confirmModalOkBtn');

  if (!modal || !titleEl || !msgEl || !confirmBtn) {
    // Fallback if modal elements missing
    if (window.confirm(`${title}\n\n${message}`)) {
      if (typeof onConfirm === 'function') onConfirm();
    }
    return;
  }

  titleEl.textContent = title;
  msgEl.textContent = message;

  // Re-bind action button
  const newBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);

  newBtn.onclick = () => {
    modal.classList.add('hidden');
    if (typeof onConfirm === 'function') onConfirm();
  };

  modal.classList.remove('hidden');
}

export function closeConfirmModal() {
  const modal = document.getElementById('confirmModal');
  if (modal) modal.classList.add('hidden');
}

if (typeof window !== 'undefined') {
  window.showConfirmModal = showConfirmModal;
  window.closeConfirmModal = closeConfirmModal;
}
