/**
 * src/components/stepper.js: 3-Step Interactive Progress Stepper Component
 */

export function updateCvStepper(stepNumber) {
  if (typeof document === 'undefined') return;

  const steps = [1, 2, 3];
  steps.forEach(num => {
    const stepEl = document.getElementById(`cvStep${num}`);
    const badgeEl = document.getElementById(`cvStepBadge${num}`);
    if (!stepEl || !badgeEl) return;

    if (num < stepNumber) {
      // Completed step
      badgeEl.className = 'w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs';
      badgeEl.innerHTML = '✓';
      stepEl.className = 'flex items-center gap-2 text-slate-800 font-bold';
    } else if (num === stepNumber) {
      // Active step
      badgeEl.className = 'w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs ring-4 ring-blue-100';
      badgeEl.innerHTML = String(num);
      stepEl.className = 'flex items-center gap-2 text-blue-600 font-extrabold';
    } else {
      // Upcoming step
      badgeEl.className = 'w-6 h-6 rounded-full bg-slate-100 border border-slate-300 text-slate-400 font-bold text-xs flex items-center justify-center shrink-0';
      badgeEl.innerHTML = String(num);
      stepEl.className = 'flex items-center gap-2 text-slate-400 font-medium';
    }
  });
}
