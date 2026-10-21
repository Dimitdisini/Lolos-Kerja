/**
 * src/components/emptystate.js: Clean Empty State Component
 */

export function renderEmptyState({ title, description, actionText, onAction }) {
  return `
    <div class="text-center py-10 px-4 space-y-3">
      <div class="w-12 h-12 mx-auto rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
      </div>
      <div class="space-y-1">
        <h4 class="text-sm font-bold text-slate-800">${title}</h4>
        <p class="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">${description}</p>
      </div>
      ${actionText ? `
        <button type="button" onclick="${onAction}" class="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition shadow-xs cursor-pointer">
          ${actionText}
        </button>
      ` : ''}
    </div>
  `;
}
