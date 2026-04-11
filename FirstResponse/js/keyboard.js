// =====================
// KEYBOARD.JS
// Keyboard shortcuts
// =====================

import { state } from './state.js';
import {
    renderDispatchModal,
    renderCallQueue,
    renderUnitStatus,
    showToast
} from './ui.js';
import {
    dispatchNearest,
    getCallQueue
} from './dispatch.js';
import { recallUnit } from './units.js';
import { play, playDispatchBeep, playWarning } from './audio.js';
// =====================
// SHORTCUT DEFINITIONS
// =====================

export const SHORTCUTS = [
    { key: 'Space', description: 'Pause / Resume simulation' },
    { key: '1', description: 'Set speed to 1x' },
    { key: '2', description: 'Set speed to 2x' },
    { key: '4', description: 'Set speed to 4x' },
    { key: 'D', description: 'Dispatch nearest to top call' },
    { key: 'A', description: 'Dispatch ALL pending calls' },
    { key: 'R', description: 'Recall all returning units' },
    { key: 'Escape', description: 'Close modal / clear selection' },
    { key: 'Tab', description: 'Cycle through active calls' },
    { key: '?', description: 'Toggle shortcut reference' },
];

// =====================
// INIT
// =====================

export function initKeyboard(pauseFn, resumeFn) {
    document.addEventListener('keydown', e => {

        // Ignore if typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.code) {

            // ---- PAUSE / RESUME ----
            case 'Space':
                e.preventDefault();
                if (state.sim.running) {
                    pauseFn();
                    showToast('SIMULATION PAUSED', 'warning');
                    document.getElementById('btn-pause').textContent = '▶ RESUME';
                    document.getElementById('btn-pause').classList.add('ctrl-btn--active');
                } else {
                    resumeFn();
                    showToast('SIMULATION RESUMED', 'success');
                    document.getElementById('btn-pause').textContent = '⏸ PAUSE';
                    document.getElementById('btn-pause').classList.remove('ctrl-btn--active');
                }
                break;

            // ---- SPEED ----
            case 'Digit1':
                state.sim.speed = 1;
                document.getElementById('btn-speed').textContent = '1x';
                showToast('SPEED: 1x', 'info');
                break;

            case 'Digit2':
                state.sim.speed = 2;
                document.getElementById('btn-speed').textContent = '2x';
                showToast('SPEED: 2x', 'info');
                break;

            case 'Digit4':
                state.sim.speed = 4;
                document.getElementById('btn-speed').textContent = '4x';
                showToast('SPEED: 4x', 'info');
                break;

            // ---- DISPATCH NEAREST TO TOP CALL ----
            case 'KeyD':
                e.preventDefault();
                const queue = getCallQueue();
                const topCall = queue.find(i => i.status === 'pending');
                if (topCall) {
                    const result = dispatchNearest(topCall.id);
                    showToast(result.message, result.success ? 'success' : 'danger');
                    renderCallQueue();
                    renderUnitStatus();

                } else {
                    showToast('NO PENDING CALLS', 'warning');
                }
                if (result.success) play(playDispatchBeep);
                else play(playWarning);
                break;

            // ---- DISPATCH ALL PENDING ----
            case 'KeyA':
                e.preventDefault();
                const pending = getCallQueue().filter(i => i.status === 'pending');
                if (pending.length === 0) {
                    showToast('NO PENDING CALLS', 'warning');
                    break;
                }
                let dispatched = 0;
                pending.forEach(incident => {
                    const result = dispatchNearest(incident.id);
                    if (result.success) dispatched++;
                });
                showToast(
                    `DISPATCHED ${dispatched}/${pending.length} PENDING CALLS`,
                    dispatched > 0 ? 'success' : 'danger'
                );
                if (dispatched > 0) play(playDispatchBeep);
                else play(playWarning);
                renderCallQueue();
                renderUnitStatus();
                break;

            // ---- RECALL ALL RETURNING ----
            case 'KeyR':
                e.preventDefault();
                const returning = state.units.filter(
                    u => u.status !== 'available' && u.status !== 'returning'
                );
                if (returning.length === 0) {
                    showToast('NO UNITS TO RECALL', 'warning');
                    break;
                }
                returning.forEach(u => recallUnit(u.id));
                showToast(`RECALLED ${returning.length} UNITS`, 'warning');
                renderCallQueue();
                renderUnitStatus();
                break;

            // ---- CLOSE MODAL ----
            case 'Escape':
                const modal = document.getElementById('dispatch-modal');
                if (modal) {
                    modal.remove();
                    window._selectedIncident = null;
                    renderCallQueue();
                }
                toggleShortcutPanel(false);
                break;

            // ---- CYCLE CALLS ----
            case 'Tab':
                e.preventDefault();
                cycleSelectedCall();
                break;

            // ---- SHORTCUT REFERENCE ----
            case 'Slash':
                if (e.shiftKey) {
                    e.preventDefault();
                    toggleShortcutPanel();
                }
                break;

        }
    });
}

// =====================
// CYCLE CALLS
// =====================

function cycleSelectedCall() {
    const queue = getCallQueue();
    if (queue.length === 0) return;

    const current = window._selectedIncident;
    const index = queue.findIndex(i => i.id === current);
    const next = queue[(index + 1) % queue.length];

    window._selectedIncident = next.id;
    renderDispatchModal(next.id);
    renderCallQueue();
}

// =====================
// SHORTCUT PANEL
// =====================

let panelVisible = false;

export function toggleShortcutPanel(force) {
    panelVisible = force !== undefined ? force : !panelVisible;

    const existing = document.getElementById('shortcut-panel');
    if (existing) existing.remove();

    if (!panelVisible) return;

    const panel = document.createElement('div');
    panel.id = 'shortcut-panel';
    panel.className = 'shortcut-panel';

    panel.innerHTML = `
    <div class="shortcut-panel__header">
      <span class="shortcut-panel__title">KEYBOARD SHORTCUTS</span>
      <button class="dispatch-modal__close" id="btn-close-shortcuts">✕</button>
    </div>
    <div class="shortcut-panel__list">
      ${SHORTCUTS.map(s => `
        <div class="shortcut-row">
          <span class="shortcut-key">${s.key}</span>
          <span class="shortcut-desc">${s.description}</span>
        </div>
      `).join('')}
    </div>
    <div class="shortcut-panel__footer">
      Press <span class="shortcut-key">?</span> to close
    </div>
  `;

    document.body.appendChild(panel);

    document.getElementById('btn-close-shortcuts').addEventListener('click', () => {
        toggleShortcutPanel(false);
    });
}