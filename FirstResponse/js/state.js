// =====================
// STATE.JS
// Single source of truth
// =====================

export const state = {

    // --- SIMULATION ---
    sim: {
        running: true,
        speed: 1,
        tick: 0,
        time: 0,        // seconds elapsed
        day: 1,
    },

    // --- UNITS ---
    units: [],

    // --- INCIDENTS ---
    incidents: {
        active: [],
        resolved: [],
    },

    // --- STATS ---
    stats: {
        totalIncidents: 0,
        totalResolved: 0,
        avgResponseTime: 0,
        totalResponseTime: 0,
        byDepartment: {
            police: { dispatched: 0, resolved: 0 },
            fire: { dispatched: 0, resolved: 0 },
            ambulance: { dispatched: 0, resolved: 0 },
            tow: { dispatched: 0, resolved: 0 },
            utility: { dispatched: 0, resolved: 0 },
        },
        byPriority: {
            critical: { total: 0, resolved: 0 },
            high: { total: 0, resolved: 0 },
            medium: { total: 0, resolved: 0 },
            low: { total: 0, resolved: 0 },
        },
    },

    // --- MAP ---
    map: {
        width: 30,
        height: 30,
        bases: {
            police: { x: 4, y: 4 },
            fire: { x: 25, y: 4 },
            ambulance: { x: 4, y: 25 },
            tow: { x: 25, y: 25 },
            utility: { x: 13, y: 13 },
        },
    },

    // --- RADIO ---
    radio: {
        log: [],        // { time, unitId, dept, message, type }
        maxEntries: 50,
    },

    // --- FILTERS ---
    filters: {
        priority: 'all',
        dept: 'all',
    },

};

// =====================
// UNIT DEFINITIONS
// =====================

export const UNIT_DEFINITIONS = [
    // Police
    { id: 'P-01', dept: 'police', label: 'UNIT P-01' },
    { id: 'P-02', dept: 'police', label: 'UNIT P-02' },
    { id: 'P-03', dept: 'police', label: 'UNIT P-03' },
    { id: 'P-04', dept: 'police', label: 'UNIT P-04' },

    // Fire
    { id: 'F-01', dept: 'fire', label: 'UNIT F-01' },
    { id: 'F-02', dept: 'fire', label: 'UNIT F-02' },
    { id: 'F-03', dept: 'fire', label: 'UNIT F-03' },

    // Ambulance
    { id: 'A-01', dept: 'ambulance', label: 'UNIT A-01' },
    { id: 'A-02', dept: 'ambulance', label: 'UNIT A-02' },
    { id: 'A-03', dept: 'ambulance', label: 'UNIT A-03' },

    // Tow
    { id: 'T-01', dept: 'tow', label: 'UNIT T-01' },
    { id: 'T-02', dept: 'tow', label: 'UNIT T-02' },

    // Utility
    { id: 'U-01', dept: 'utility', label: 'UNIT U-01' },
    { id: 'U-02', dept: 'utility', label: 'UNIT U-02' },
];

// =====================
// DEPARTMENT CONFIG
// =====================

export const DEPT_CONFIG = {
    police: {
        color: '#3b82f6',
        speed: 0.12,
        label: 'POLICE',
    },
    fire: {
        color: '#ef4444',
        speed: 0.10,
        label: 'FIRE',
    },
    ambulance: {
        color: '#22c55e',
        speed: 0.13,
        label: 'AMBULANCE',
    },
    tow: {
        color: '#f97316',
        speed: 0.07,
        label: 'TOW',
    },
    utility: {
        color: '#eab308',
        speed: 0.08,
        label: 'UTILITY',
    },
};

// =====================
// HELPERS
// =====================

export function getUnitById(id) {
    return state.units.find(u => u.id === id);
}

export function getAvailableUnits(dept) {
    return state.units.filter(u => u.dept === dept && u.status === 'available');
}

export function getIncidentById(id) {
    return state.incidents.active.find(i => i.id === id);
}

export function getDistance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

export function getNearestAvailableUnit(dept, location) {
    const available = getAvailableUnits(dept);
    if (available.length === 0) return null;

    return available.reduce((nearest, unit) => {
        const distA = getDistance(unit, location);
        const distB = getDistance(nearest, location);
        return distA < distB ? unit : nearest;
    });
}