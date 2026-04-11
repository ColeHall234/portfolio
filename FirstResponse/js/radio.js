// =====================
// RADIO.JS
// Radio chatter log
// =====================

import { state, DEPT_CONFIG } from './state.js';
import { formatSimTime } from './dispatch.js';

// =====================
// MESSAGE TEMPLATES
// =====================

const MESSAGES = {

    dispatched: [
        (unit, incident) => `${unit.id}, respond to ${incident.type} at ${incident.location}.`,
        (unit, incident) => `${unit.id}, you are dispatched to ${incident.location} for ${incident.type}.`,
        (unit, incident) => `Dispatch to ${unit.id} — ${incident.type}, ${incident.location}. Acknowledge.`,
        (unit, incident) => `${unit.id}, copy ${incident.priority.toUpperCase()} priority call at ${incident.location}.`,
    ],

    acknowledged: [
        (unit) => `${unit.id}, copy. En route.`,
        (unit) => `${unit.id} copies. Responding.`,
        (unit) => `10-4, ${unit.id} is en route.`,
        (unit) => `${unit.id}, received. On our way.`,
        (unit) => `Copy dispatch, ${unit.id} responding code 3.`,
    ],

    onscene: [
        (unit) => `${unit.id}, on scene.`,
        (unit) => `${unit.id} is 10-23, on location.`,
        (unit) => `Dispatch, ${unit.id} arriving now.`,
        (unit) => `${unit.id} on scene, stand by.`,
        (unit) => `${unit.id}, we are 10-97.`,
    ],

    clearing: [
        (unit, incident) => `${unit.id}, clear at ${incident?.location || 'location'}. Returning to service.`,
        (unit) => `${unit.id} is 10-8, available.`,
        (unit) => `Dispatch, ${unit.id} clearing the scene.`,
        (unit) => `${unit.id}, situation handled. En route to base.`,
        (unit) => `${unit.id} clear, returning to ${unit.dept.toUpperCase()} base.`,
    ],

    atbase: [
        (unit) => `${unit.id}, back in service at base.`,
        (unit) => `${unit.id} is 10-42, back at station.`,
        (unit) => `Dispatch, ${unit.id} returned to base.`,
    ],

    newincident: [
        (incident) => `All units, be advised — ${incident.priority.toUpperCase()} priority ${incident.type} reported at ${incident.location}.`,
        (incident) => `Incoming ${incident.priority.toUpperCase()} call — ${incident.type}, ${incident.location}.`,
        (incident) => `Dispatch receiving ${incident.type} at ${incident.location}. ${incident.priority.toUpperCase()} priority.`,
    ],

    nounit: [
        (dept) => `Dispatch to all ${dept.toUpperCase()} units — no units available for pending call.`,
        (dept) => `${dept.toUpperCase()} units, we have a pending call with no available response.`,
    ],

};

// =====================
// ADD MESSAGE
// =====================

function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function addRadioMessage(type, unit, incident, dept) {
    let message = '';

    switch (type) {
        case 'dispatched':
            message = randomFrom(MESSAGES.dispatched)(unit, incident);
            break;
        case 'acknowledged':
            message = randomFrom(MESSAGES.acknowledged)(unit);
            break;
        case 'onscene':
            message = randomFrom(MESSAGES.onscene)(unit);
            break;
        case 'clearing':
            message = randomFrom(MESSAGES.clearing)(unit, incident);
            break;
        case 'atbase':
            message = randomFrom(MESSAGES.atbase)(unit);
            break;
        case 'newincident':
            message = randomFrom(MESSAGES.newincident)(incident);
            break;
        case 'nounit':
            message = randomFrom(MESSAGES.nounit)(dept);
            break;
        default:
            message = 'Radio transmission received.';
    }

    const entry = {
        time: formatSimTime(state.sim.time),
        unitId: unit?.id || 'DISPATCH',
        dept: unit?.dept || dept || 'dispatch',
        message,
        type,
    };

    state.radio.log.unshift(entry);

    // Trim log
    if (state.radio.log.length > state.radio.maxEntries) {
        state.radio.log = state.radio.log.slice(0, state.radio.maxEntries);
    }

    return entry;
}

// =====================
// RENDER RADIO LOG
// =====================

export function renderRadioLog() {
    const container = document.getElementById('incident-log');
    if (!container) return;

    if (state.radio.log.length === 0) {
        container.innerHTML = '<p class="empty-state">RADIO SILENT</p>';
        return;
    }

    container.innerHTML = state.radio.log.map(entry => {
        const color = entry.dept === 'dispatch'
            ? '#94a3b8'
            : DEPT_CONFIG[entry.dept]?.color || '#94a3b8';

        const typeIcon = {
            dispatched: '📡',
            acknowledged: '✅',
            onscene: '🔴',
            clearing: '🔵',
            atbase: '⬛',
            newincident: '⚠️',
            nounit: '❌',
        }[entry.type] || '📻';

        return `
      <div class="radio-entry">
        <span class="radio-entry__time">${entry.time}</span>
        <span class="radio-entry__icon">${typeIcon}</span>
        <span class="radio-entry__unit" style="color:${color}">
          ${entry.unitId}
        </span>
        <span class="radio-entry__message">${entry.message}</span>
      </div>
    `;
    }).join('');
}