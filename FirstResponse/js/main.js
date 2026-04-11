// =====================
// MAIN.JS
// Entry point and game loop
// =====================

import { state } from './state.js';
import { initUnits } from './units.js';
import { tickUnits } from './units.js';
import { tickIncidents } from './incidents.js';
import { tickSpawn, getCallQueue } from './dispatch.js';
import { initMap, drawMap } from './map.js';
import {
    updateTopbar,
    renderCallQueue,
    renderUnitStatus,
    renderIncidentLog,
    initTabs,
    initSpeedToggle,
    initPauseToggle,
    initThemeToggle,
    initFilters,
    showToast,
    renderDispatchModal,
} from './ui.js';
import { renderRadioLog } from './radio.js';
import { initKeyboard, toggleShortcutPanel } from './keyboard.js';
import { toggleMute, isMuted } from './audio.js';
// =====================
// CONSTANTS
// =====================

const TICK_RATE = 100; // ms per tick — 10 ticks per second
let gameLoop = null;

// =====================
// INIT
// =====================

function init() {
    initUnits();
    initMap();
    initTabs();
    initSpeedToggle();
    initFilters();
    initThemeToggle();
    initPauseToggle(pauseSim, resumeSim);
    initKeyboard(pauseSim, resumeSim);

    // Map click events
    window.addEventListener('incident-clicked', (e) => {
        renderDispatchModal(e.detail.incidentId);
    });

    window.addEventListener('unit-clicked', (e) => {
        const unit = state.units.find(u => u.id === e.detail.unitId);
        if (unit && unit.incidentId) {
            renderDispatchModal(unit.incidentId);
        }
    });
    document.getElementById('btn-mute').addEventListener('click', () => {
        const muted = toggleMute();
        document.getElementById('btn-mute').textContent = muted ? '🔇' : '🔊';
        document.getElementById('btn-mute').classList.toggle('ctrl-btn--active', muted);
    });

    renderUnitStatus();
    renderCallQueue();
    updateTopbar();

    startLoop();

    showToast('FIRSTRESPONSE CAD SYSTEM ONLINE', 'success');
}

// =====================
// LOOP
// =====================

function startLoop() {
    gameLoop = setInterval(tick, TICK_RATE);
}

export function pauseSim() {
    state.sim.running = false;
    clearInterval(gameLoop);
}

export function resumeSim() {
    state.sim.running = true;
    startLoop();
}

// =====================
// TICK
// =====================

function tick() {
    if (!state.sim.running) return;

    // Advance sim time
    state.sim.time += (TICK_RATE / 1000) * state.sim.speed;
    state.sim.tick++;

    // Move units
    tickUnits();

    // Check incident status
    tickIncidents();

    // Spawn new incidents
    const newIncident = tickSpawn();
    if (newIncident) {
        const priorityToast = {
            critical: 'danger',
            high: 'warning',
            medium: 'info',
            low: 'info',
        }[newIncident.priority];

        showToast(
            `[${newIncident.priority.toUpperCase()}] ${newIncident.type} — ${newIncident.location}`,
            priorityToast
        );
    }

    // Draw map every tick
    drawMap();

    // Update UI every 5 ticks
    if (state.sim.tick % 5 === 0) {
        updateTopbar();
        renderCallQueue();
        renderUnitStatus();
    }

    // Update log every 20 ticks
    if (state.sim.tick % 20 === 0) {
        renderRadioLog();
    }
}

// Expose to global for topbar button
window.toggleShortcutPanel = toggleShortcutPanel;

// =====================
// BOOT
// =====================

init();