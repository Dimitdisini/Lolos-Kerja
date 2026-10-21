/**
 * src/components/toast.js: Non-blocking Clean Notification System
 */

export function showToast(message, type = 'info') {
  if (typeof document === 'undefined') return;

  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const bgColors = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-rose-600 text-white',
    info: 'bg-slate-900 text-white',
    warning: 'bg-amber-500 text-slate-900'
  };

  toast.className = `${bgColors[type] || bgColors.info} p-3.5 rounded-xl shadow-lg text-xs font-semibold flex items-center justify-between gap-3 pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-200`;
  toast.innerHTML = `
    <span class="flex-1">${message}</span>
    <button class="opacity-75 hover:opacity-100 p-0.5 rounded cursor-pointer" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.add('opacity-0', 'transition', 'duration-300');
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}

// Make accessible on window object as well
if (typeof window !== 'undefined') {
  window.showToast = showToast;
}
