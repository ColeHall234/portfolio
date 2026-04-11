// =====================
// DISPATCH.JS
// Dispatch logic and call management
// =====================

import { state, getNearestAvailableUnit, getAvailableUnits } from './state.js';
import { dispatchToIncident, autoDispatch, generateIncident, addIncident, shouldSpawnIncident } from './incidents.js';
import { returnToBase } from './units.js';
import { play, playWarning, playAllClear } from './audio.js';
// =====================
// SELECTED INCIDENT
// =====================

let selectedIncidentId = null;

export function getSelectedIncidentId() {
    return selectedIncidentId;
}

export function setSelectedIncident(id) {
    selectedIncidentId = id;
}

// =====================
// MANUAL DISPATCH
// =====================

export function manualDispatch(incidentId, unitId) {
    const incident = state.incidents.active.find(i => i.id === incidentId);
    const unit = state.units.find(u => u.id === unitId);

    if (!incident) return { success: false, message: 'INCIDENT NOT FOUND' };
    if (!unit) return { success: false, message: 'UNIT NOT FOUND' };

    if (unit.status !== 'available') {
        return { success: false, message: `${unit.id} IS NOT AVAILABLE` };
    }

    const result = dispatchToIncident(incidentId, unitId);

    if (result.success) {
        const u = state.units.find(u => u.id === unitId);
        if (u) u.onSceneMax = incident.onSceneTime;
    }

    return result;
}

// =====================
// DISPATCH NEAREST
// =====================

export function dispatchNearest(incidentId) {
    const incident = state.incidents.active.find(i => i.id === incidentId);
    if (!incident) return { success: false, message: 'INCIDENT NOT FOUND' };

    const dispatched = [];
    const failed = [];

    // Always dispatch primary department
    const primaryResult = autoDispatch(incident);
    if (primaryResult) {
        dispatched.push(incident.dept);
    } else {
        failed.push(incident.dept);
    }

    // Dispatch secondary units if required
    if (incident.requiresAmbulance) {
        const secondary = { ...incident, dept: 'ambulance' };
        const unit = getNearestAvailableUnit('ambulance', incident);
        if (unit) {
            const r = dispatchToIncident(incidentId, unit.id);
            if (r.success) {
                const u = state.units.find(u => u.id === unit.id);
                if (u) u.onSceneMax = incident.onSceneTime;
                dispatched.push('ambulance');
            }
        } else {
            failed.push('ambulance');
        }
    }

    if (incident.requiresPolice) {
        const unit = getNearestAvailableUnit('police', incident);
        if (unit) {
            const r = dispatchToIncident(incidentId, unit.id);
            if (r.success) {
                const u = state.units.find(u => u.id === unit.id);
                if (u) u.onSceneMax = incident.onSceneTime;
                dispatched.push('police');
            }
        } else {
            failed.push('police');
        }
    }

    if (incident.requiresFire) {
        const unit = getNearestAvailableUnit('fire', incident);
        if (unit) {
            const r = dispatchToIncident(incidentId, unit.id);
            if (r.success) {
                const u = state.units.find(u => u.id === unit.id);
                if (u) u.onSceneMax = incident.onSceneTime;
                dispatched.push('fire');
            }
        } else {
            failed.push('fire');
        }
    }

    if (incident.requiresTow) {
        const unit = getNearestAvailableUnit('tow', incident);
        if (unit) {
            const r = dispatchToIncident(incidentId, unit.id);
            if (r.success) {
                const u = state.units.find(u => u.id === unit.id);
                if (u) u.onSceneMax = incident.onSceneTime;
                dispatched.push('tow');
            }
        } else {
            failed.push('tow');
        }
    }

    if (incident.requiresUtility) {
        const unit = getNearestAvailableUnit('utility', incident);
        if (unit) {
            const r = dispatchToIncident(incidentId, unit.id);
            if (r.success) {
                const u = state.units.find(u => u.id === unit.id);
                if (u) u.onSceneMax = incident.onSceneTime;
                dispatched.push('utility');
            }
        } else {
            failed.push('utility');
        }
    }

    if (dispatched.length === 0) {
        return { success: false, message: 'NO UNITS AVAILABLE' };
    }

    const message = `DISPATCHED: ${dispatched.map(d => d.toUpperCase()).join(', ')}` +
        (failed.length > 0 ? ` | NO ${failed.map(d => d.toUpperCase()).join(', ')} AVAILABLE` : '');
    if (dispatched.length === 0) {
        play(playWarning);
        return { success: false, message: 'NO UNITS AVAILABLE' };
    }

    return { success: true, message };
}

// =====================
// RECALL UNIT
// =====================

export function recallUnit(unitId) {
    const unit = state.units.find(u => u.id === unitId);
    if (!unit) return { success: false, message: 'UNIT NOT FOUND' };

    if (unit.status === 'available') {
        return { success: false, message: `${unit.id} ALREADY AT BASE` };
    }

    if (unit.status === 'returning') {
        return { success: false, message: `${unit.id} ALREADY RETURNING` };
    }

    // Remove from incident
    if (unit.incidentId) {
        const incident = state.incidents.active.find(i => i.id === unit.incidentId);
        if (incident) {
            incident.assignedUnits = incident.assignedUnits.filter(id => id !== unitId);
            if (incident.assignedUnits.length === 0) {
                incident.status = 'pending';
            }
        }
    }

    returnToBase(unit);
    return { success: true, message: `${unit.id} RECALLED TO BASE` };
}

// =====================
// SPAWN TICK
// =====================

export function tickSpawn() {
    if (shouldSpawnIncident()) {
        const incident = generateIncident();
        addIncident(incident);
        return incident;
    }
    return null;
}

// =====================
// GET CALL QUEUE DATA
// =====================

export function getCallQueue() {
    return [...state.incidents.active]
        .sort((a, b) => {
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
}

// =====================
// GET AVAILABLE UNITS
// FOR INCIDENT
// =====================

export function getAvailableUnitsForIncident(dept) {
    return getAvailableUnits(dept);
}

// =====================
// FORMAT TIME
// =====================

export function formatSimTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// =====================
// FORMAT RESPONSE TIME
// =====================

export function formatResponseTime(seconds) {
    if (!seconds || seconds === 0) return '--';
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
}