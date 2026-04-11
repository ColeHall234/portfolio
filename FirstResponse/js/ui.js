// =====================
// UI.JS
// DOM updates and rendering
// =====================

import { state, DEPT_CONFIG } from './state.js';
import {
    getCallQueue, getAvailableUnitsForIncident,
    dispatchNearest, manualDispatch,
    recallUnit, formatSimTime,
    formatResponseTime
} from './dispatch.js';
import { getUnitCounts, getTotalAvailable } from './units.js';
import { getRecentResolved, renderStatsPanel } from './stats.js';

// =====================
// TOPBAR STATS
// =====================

export function updateTopbar() {
    const incidents = document.getElementById('stat-incidents');
    const available = document.getElementById('stat-available');
    const resolved = document.getElementById('stat-resolved');
    const response = document.getElementById('stat-response');
    const time = document.getElementById('stat-time');

    if (incidents) incidents.textContent = state.incidents.active.length;
    if (available) available.textContent = getTotalAvailable();
    if (resolved) resolved.textContent = state.stats.totalResolved;
    if (response) response.textContent = formatResponseTime(state.stats.avgResponseTime);
    if (time) time.textContent = formatSimTime(state.sim.time);
}

// =====================
// CALL QUEUE
// =====================
function getFilteredQueue() {
    let queue = getCallQueue();

    if (state.filters.priority !== 'all') {
        queue = queue.filter(i => i.priority === state.filters.priority);
    }

    if (state.filters.dept !== 'all') {
        queue = queue.filter(i => i.dept === state.filters.dept);
    }

    return queue;
}
export function renderCallQueue() {
    const container = document.getElementById('call-queue');
    const badge = document.getElementById('call-count');
    if (!container) return;

    const queue = getFilteredQueue();

    if (badge) {
        badge.textContent = queue.length;
        badge.style.backgroundColor = queue.some(i => i.priority === 'critical')
            ? 'var(--danger)'
            : queue.length > 0 ? 'var(--warning)' : 'var(--text-muted)';
    }

    if (queue.length === 0) {
        container.innerHTML = '<p class="empty-state">NO ACTIVE CALLS</p>';
        return;
    }

    container.innerHTML = queue.map(incident => {
        const isSelected = incident.id === window._selectedIncident;

        return `
      <div class="call-card call-card--${incident.dept}
           ${incident.priority === 'critical' ? 'call-card--critical' : ''}
           ${isSelected ? 'call-card--selected' : ''}"
           data-incident-id="${incident.id}">

        <div class="call-card__header">
          <span class="call-card__type">${incident.type}</span>
          <span class="call-card__priority
                call-card__priority--${incident.priority}">
            ${incident.priority.toUpperCase()}
          </span>
        </div>

        <div class="call-card__location">📍 ${incident.location}</div>

        <div class="call-card__meta">
          ${incident.requiresAmbulance ? '<span class="req-badge req-badge--ambulance">AMB</span>' : ''}
          ${incident.requiresPolice ? '<span class="req-badge req-badge--police">POL</span>' : ''}
          ${incident.requiresFire ? '<span class="req-badge req-badge--fire">FIRE</span>' : ''}
          ${incident.requiresTow ? '<span class="req-badge req-badge--tow">TOW</span>' : ''}
          ${incident.requiresUtility ? '<span class="req-badge req-badge--utility">UTIL</span>' : ''}
        </div>

        <div class="call-card__status">
          <span class="call-status call-status--${incident.status}">
            ${incident.status.toUpperCase()}
          </span>
          <span class="call-card__time">
            +${Math.floor(state.sim.time - incident.createdAt)}s
          </span>
        </div>

        <div class="call-card__actions">
          ${incident.status === 'pending' ? `
            <button class="call-card__dispatch-btn btn-dispatch-nearest"
              data-incident-id="${incident.id}">
              ⚡ DISPATCH NEAREST
            </button>
          ` : ''}
          <button class="call-card__dispatch-btn btn-select-incident"
            data-incident-id="${incident.id}">
            SELECT
          </button>
        </div>

      </div>
    `;
    }).join('');

    // Attach listeners
    container.querySelectorAll('.btn-dispatch-nearest').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const id = btn.dataset.incidentId;
            const result = dispatchNearest(id);
            showToast(result.message, result.success ? 'success' : 'danger');
            renderCallQueue();
            renderUnitStatus();
        });
    });

    container.querySelectorAll('.btn-select-incident').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            window._selectedIncident = btn.dataset.incidentId;
            renderCallQueue();
            renderDispatchModal(btn.dataset.incidentId);
        });
    });
}

// =====================
// DISPATCH MODAL
// =====================

export function renderDispatchModal(incidentId) {
    const existing = document.getElementById('dispatch-modal');
    if (existing) existing.remove();

    const incident = state.incidents.active.find(i => i.id === incidentId);
    if (!incident) return;

    const availableUnits = getAvailableUnitsForIncident(incident.dept);
    const assignedUnits = state.units.filter(
        u => incident.assignedUnits.includes(u.id)
    );

    const modal = document.createElement('div');
    modal.id = 'dispatch-modal';
    modal.className = 'dispatch-modal';

    modal.innerHTML = `
    <div class="dispatch-modal__header">
      <div class="dispatch-modal__title-row">
        <span class="dispatch-modal__id">${incident.id}</span>
        <span class="call-card__priority call-card__priority--${incident.priority}">
          ${incident.priority.toUpperCase()}
        </span>
        <button class="dispatch-modal__close" id="btn-close-modal">✕</button>
      </div>
      <div class="dispatch-modal__type">${incident.type}</div>
      <div class="dispatch-modal__location">📍 ${incident.location}</div>
      <div class="dispatch-modal__desc">${incident.description}</div>
    </div>

    <div class="dispatch-modal__body">

      <div class="dispatch-modal__section">
        <span class="dispatch-modal__section-title">ASSIGNED UNITS</span>
        ${assignedUnits.length === 0
            ? '<span class="dispatch-modal__empty">NONE</span>'
            : assignedUnits.map(u => `
              <div class="dispatch-unit-row">
                <span class="dispatch-unit-row__id"
                  style="color:${DEPT_CONFIG[u.dept].color}">
                  ${u.id}
                </span>
                <span class="dispatch-unit-row__status">
                  ${u.status.toUpperCase()}
                </span>
                <button class="dispatch-unit-row__recall btn-recall"
                  data-unit-id="${u.id}">
                  RECALL
                </button>
              </div>
            `).join('')
        }
      </div>

      <div class="dispatch-modal__section">
        <span class="dispatch-modal__section-title">
          AVAILABLE ${incident.dept.toUpperCase()} UNITS
        </span>
        ${availableUnits.length === 0
            ? '<span class="dispatch-modal__empty">NO UNITS AVAILABLE</span>'
            : availableUnits.map(u => `
              <div class="dispatch-unit-row">
                <span class="dispatch-unit-row__id"
                  style="color:${DEPT_CONFIG[u.dept].color}">
                  ${u.id}
                </span>
                <span class="dispatch-unit-row__status">AVAILABLE</span>
                <button class="dispatch-unit-row__recall btn-manual-dispatch"
                  data-unit-id="${u.id}"
                  data-incident-id="${incident.id}">
                  DISPATCH
                </button>
              </div>
            `).join('')
        }
      </div>

    </div>

    <div class="dispatch-modal__footer">
      <button class="ctrl-btn ctrl-btn--active btn-dispatch-all"
        data-incident-id="${incident.id}">
        ⚡ DISPATCH ALL NEAREST
      </button>
    </div>
  `;

    document.querySelector('.map-wrap').appendChild(modal);

    // Close
    document.getElementById('btn-close-modal').addEventListener('click', () => {
        modal.remove();
        window._selectedIncident = null;
        renderCallQueue();
    });

    // Recall buttons
    modal.querySelectorAll('.btn-recall').forEach(btn => {
        btn.addEventListener('click', () => {
            const result = recallUnit(btn.dataset.unitId);
            showToast(result.message, result.success ? 'success' : 'danger');
            renderDispatchModal(incidentId);
            renderUnitStatus();
        });
    });

    // Manual dispatch buttons
    modal.querySelectorAll('.btn-manual-dispatch').forEach(btn => {
        btn.addEventListener('click', () => {
            const result = manualDispatch(
                btn.dataset.incidentId,
                btn.dataset.unitId
            );
            showToast(result.message, result.success ? 'success' : 'danger');
            renderDispatchModal(incidentId);
            renderUnitStatus();
        });
    });

    // Dispatch all nearest
    modal.querySelector('.btn-dispatch-all').addEventListener('click', () => {
        const result = dispatchNearest(incident.id);
        showToast(result.message, result.success ? 'success' : 'danger');
        renderDispatchModal(incidentId);
        renderUnitStatus();
        renderCallQueue();
    });
}

// =====================
// UNIT STATUS
// =====================

export function renderUnitStatus() {
    const depts = ['police', 'fire', 'ambulance', 'tow', 'utility'];

    depts.forEach(dept => {
        const container = document.getElementById(`units-${dept}`);
        const counter = document.getElementById(`count-${dept}`);
        if (!container) return;

        const units = state.units.filter(u => u.dept === dept);
        const available = units.filter(u => u.status === 'available').length;

        if (counter) counter.textContent = `${available}/${units.length}`;

        container.innerHTML = units.map(unit => {
            const incident = unit.incidentId
                ? state.incidents.active.find(i => i.id === unit.incidentId)
                : null;

            return `
        <div class="unit-row" data-unit-id="${unit.id}">
          <span class="unit-row__id"
            style="color:${DEPT_CONFIG[dept].color}">
            ${unit.id}
          </span>
          <span class="unit-row__assignment">
            ${incident ? incident.type : '--'}
          </span>
          <span class="unit-row__status unit-row__status--${unit.status}">
            ${unit.status === 'available' ? 'AVL' :
                    unit.status === 'dispatched' ? 'DSP' :
                        unit.status === 'onscene' ? 'OSC' :
                            unit.status === 'returning' ? 'RTB' : '---'}
          </span>
        </div>
      `;
        }).join('');

        // Click unit row to recall
        container.querySelectorAll('.unit-row').forEach(row => {
            row.addEventListener('click', () => {
                const unitId = row.dataset.unitId;
                const unit = state.units.find(u => u.id === unitId);
                if (unit && unit.status !== 'available' && unit.status !== 'returning') {
                    const result = recallUnit(unitId);
                    showToast(result.message, result.success ? 'success' : 'danger');
                    renderUnitStatus();
                }
            });
        });
    });
}

// =====================
// INCIDENT LOG
// =====================

export function renderIncidentLog() {
    const container = document.getElementById('incident-log');
    if (!container) return;

    const recent = getRecentResolved(20);

    if (recent.length === 0) {
        container.innerHTML = '<p class="empty-state">NO INCIDENTS RESOLVED YET</p>';
        return;
    }

    container.innerHTML = recent.map(incident => {
        const responseTime = incident.dispatchedAt !== null
            ? formatResponseTime(incident.dispatchedAt - incident.createdAt)
            : '--';

        return `
      <div class="log-entry log-entry--${incident.dept}">
        <div class="log-entry__id">${incident.id}</div>
        <div class="log-entry__type">${incident.type}</div>
        <div class="log-entry__detail">
          📍 ${incident.location}
        </div>
        <div class="log-entry__detail">
          ⏱ RESP: ${responseTime}
        </div>
      </div>
    `;
    }).join('');
}

// =====================
// BOTTOM BAR TABS
// =====================

export function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('tab-btn--active'));
            tab.classList.add('tab-btn--active');

            document.querySelectorAll('.tab-panel').forEach(p => {
                p.classList.add('hidden');
            });

            const panel = document.getElementById(`tab-${tab.dataset.tab}`);
            if (panel) panel.classList.remove('hidden');

            if (tab.dataset.tab === 'stats') renderStatsPanel();
        });
    });
}

// =====================
// SPEED TOGGLE
// =====================

export function initSpeedToggle() {
    const btn = document.getElementById('btn-speed');
    if (!btn) return;

    btn.addEventListener('click', () => {
        const speeds = [1, 2, 4];
        const current = state.sim.speed;
        const next = speeds[(speeds.indexOf(current) + 1) % speeds.length];
        state.sim.speed = next;
        btn.textContent = `${next}x`;
    });
}

// =====================
// PAUSE TOGGLE
// =====================

export function initPauseToggle(pauseFn, resumeFn) {
    const btn = document.getElementById('btn-pause');
    if (!btn) return;

    btn.addEventListener('click', () => {
        if (state.sim.running) {
            pauseFn();
            btn.textContent = '▶ RESUME';
            btn.classList.add('ctrl-btn--active');
        } else {
            resumeFn();
            btn.textContent = '⏸ PAUSE';
            btn.classList.remove('ctrl-btn--active');
        }
    });
}

// =====================
// THEME TOGGLE
// =====================

export function initThemeToggle() {
    const btn = document.getElementById('btn-theme');
    const html = document.documentElement;
    if (!btn) return;

    btn.addEventListener('click', () => {
        const current = html.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        btn.textContent = next === 'dark' ? '☀' : '🌙';
    });
}

// =====================
// TOAST
// =====================

export function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('toast--visible'));

    setTimeout(() => {
        toast.classList.remove('toast--visible');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// =====================
// QUEUE FILTERS
// =====================

export function initFilters() {
    const buttons = document.querySelectorAll('.filter-btn');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.filterType;
            const value = btn.dataset.filterValue;

            // Update state
            state.filters[type] = value;

            // Update active class for this row only
            document.querySelectorAll(`[data-filter-type="${type}"]`)
                .forEach(b => b.classList.remove('filter-btn--active'));
            btn.classList.add('filter-btn--active');

            // Re-render queue
            renderCallQueue();
        });
    });
}