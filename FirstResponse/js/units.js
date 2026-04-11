// =====================
// UNITS.JS
// Unit movement with A* pathfinding
// =====================

import { state, UNIT_DEFINITIONS, DEPT_CONFIG, getDistance } from './state.js';
import { findPath, getNearestIntersection } from './map.js';
import { addRadioMessage } from './radio.js';
import { play, playDispatchBeep, playRadioStatic, playAllClear } from './audio.js';
// =====================
// INITIALIZE UNITS
// =====================

export function initUnits() {
    state.units = UNIT_DEFINITIONS.map(def => {
        const base = state.map.bases[def.dept];
        return {
            id: def.id,
            dept: def.dept,
            label: def.label,
            status: 'available',
            x: base.x,
            y: base.y,
            targetX: base.x,
            targetY: base.y,
            path: [],
            pathIndex: 0,
            incidentId: null,
            speed: DEPT_CONFIG[def.dept].speed,
            onSceneTime: 0,
            onSceneMax: 0,
        };
    });
}

// =====================
// DISPATCH UNIT
// =====================

export function dispatchUnit(unitId, incident) {
    const unit = state.units.find(u => u.id === unitId);
    if (!unit || unit.status !== 'available') return false;

    unit.status = 'dispatched';
    unit.incidentId = incident.id;
    unit.targetX = incident.x;
    unit.targetY = incident.y;

    unit.path = findPath(unit.x, unit.y, incident.x, incident.y);
    unit.pathIndex = 0;

    state.stats.byDepartment[unit.dept].dispatched++;

    // Radio chatter
    addRadioMessage('dispatched', unit, incident);
    setTimeout(() => addRadioMessage('acknowledged', unit, incident), 1500);
    play(playDispatchBeep);
    return true;
}

// =====================
// TICK UNITS
// =====================

export function tickUnits() {
  state.units.forEach(unit => {
    if (unit.status === 'available') return;

    if (unit.status === 'dispatched') {
      moveAlongPath(unit);

      if (unit.path.length === 0 ||
          unit.pathIndex >= unit.path.length) {
        unit.x           = unit.targetX;
        unit.y           = unit.targetY;
        unit.status      = 'onscene';
        unit.onSceneTime = 0;
        unit.path        = [];
        unit.pathIndex   = 0;

        // Only fires ONCE on arrival
        const incident = state.incidents.active.find(i => i.id === unit.incidentId);
        addRadioMessage('onscene', unit, incident);
        play(playRadioStatic);
      }
    }

    if (unit.status === 'onscene') {
      unit.onSceneTime += state.sim.speed * 0.1;

      if (unit.onSceneTime >= unit.onSceneMax) {
        const incident = state.incidents.active.find(i => i.id === unit.incidentId);
        addRadioMessage('clearing', unit, incident);
        play(playRadioStatic);
        returnToBase(unit);
        // returnToBase immediately sets status to 'returning'
        // so this block never runs again for this unit
      }
    }

    if (unit.status === 'returning') {
      moveAlongPath(unit);

      if (unit.path.length === 0 ||
          unit.pathIndex >= unit.path.length) {
        const base  = state.map.bases[unit.dept];
        unit.x      = base.x;
        unit.y      = base.y;
        unit.status = 'available';
        unit.path   = [];
        unit.pathIndex = 0;

        // Only fires ONCE on return
        addRadioMessage('atbase', unit, null);
      }
    }
  });
}

// =====================
// MOVE ALONG PATH
// =====================

function moveAlongPath(unit) {
    if (!unit.path || unit.path.length === 0) return;
    if (unit.pathIndex >= unit.path.length) return;

    const target = unit.path[unit.pathIndex];
    const dx = target.x - unit.x;
    const dy = target.y - unit.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = unit.speed * state.sim.speed;

    if (dist <= step) {
        // Reached this waypoint
        unit.x = target.x;
        unit.y = target.y;
        unit.pathIndex++;
    } else {
        // Move toward waypoint
        unit.x += (dx / dist) * step;
        unit.y += (dy / dist) * step;
    }
}

// =====================
// RETURN TO BASE
// =====================

export function returnToBase(unit) {
    const base = state.map.bases[unit.dept];
    unit.status = 'returning';
    unit.targetX = base.x;
    unit.targetY = base.y;
    unit.path = findPath(unit.x, unit.y, base.x, base.y);
    unit.pathIndex = 0;
    unit.incidentId = null;
    unit.onSceneTime = 0;
    unit.onSceneMax = 0;
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
// GET UNIT COUNTS
// =====================

export function getUnitCounts() {
    const counts = {
        police: { total: 0, available: 0 },
        fire: { total: 0, available: 0 },
        ambulance: { total: 0, available: 0 },
        tow: { total: 0, available: 0 },
        utility: { total: 0, available: 0 },
    };

    state.units.forEach(unit => {
        counts[unit.dept].total++;
        if (unit.status === 'available') counts[unit.dept].available++;
    });

    return counts;
}

// =====================
// GET TOTAL AVAILABLE
// =====================

export function getTotalAvailable() {
    return state.units.filter(u => u.status === 'available').length;
}