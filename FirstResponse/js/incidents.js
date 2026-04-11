// =====================
// INCIDENTS.JS
// Incident generation and management
// =====================

import { state } from './state.js';
import { getNearestAvailableUnit, getDistance } from './state.js';
import { dispatchUnit } from './units.js';
import { addRadioMessage } from './radio.js';
import { play, playDispatchTone, playCriticalTone } from './audio.js';
// =====================
// INCIDENT DEFINITIONS
// =====================

const INCIDENT_TYPES = [

    // ===== POLICE =====
    {
        id: 'traffic_stop',
        dept: 'police',
        type: 'TRAFFIC STOP',
        description: 'Vehicle pulled over for traffic violation.',
        priority: 'low',
        onSceneTime: 120,
        requiresTow: false,
    },
    {
        id: 'disturbance',
        dept: 'police',
        type: 'DISTURBANCE',
        description: 'Noise complaint or public disturbance reported.',
        priority: 'low',
        onSceneTime: 180,
        requiresTow: false,
    },
    {
        id: 'shoplifting',
        dept: 'police',
        type: 'SHOPLIFTING',
        description: 'Retail theft in progress or just occurred.',
        priority: 'medium',
        onSceneTime: 200,
        requiresTow: false,
    },
    {
        id: 'vandalism',
        dept: 'police',
        type: 'VANDALISM',
        description: 'Property damage reported by caller.',
        priority: 'low',
        onSceneTime: 150,
        requiresTow: false,
    },
    {
        id: 'suspicious_vehicle',
        dept: 'police',
        type: 'SUSPICIOUS VEHICLE',
        description: 'Unattended or suspicious vehicle reported.',
        priority: 'low',
        onSceneTime: 100,
        requiresTow: true,
    },
    {
        id: 'domestic',
        dept: 'police',
        type: 'DOMESTIC DISPUTE',
        description: 'Domestic disturbance with potential for violence.',
        priority: 'high',
        onSceneTime: 300,
        requiresTow: false,
    },
    {
        id: 'assault',
        dept: 'police',
        type: 'ASSAULT IN PROGRESS',
        description: 'Physical altercation reported with injuries possible.',
        priority: 'high',
        onSceneTime: 240,
        requiresTow: false,
        requiresAmbulance: true,
    },
    {
        id: 'robbery',
        dept: 'police',
        type: 'ROBBERY IN PROGRESS',
        description: 'Armed robbery reported at a business.',
        priority: 'critical',
        onSceneTime: 360,
        requiresTow: false,
    },
    {
        id: 'pursuit',
        dept: 'police',
        type: 'VEHICLE PURSUIT',
        description: 'Active pursuit of a fleeing vehicle.',
        priority: 'critical',
        onSceneTime: 420,
        requiresTow: true,
    },
    {
        id: 'burglary',
        dept: 'police',
        type: 'BURGLARY IN PROGRESS',
        description: 'Break-in reported at residential address.',
        priority: 'high',
        onSceneTime: 280,
        requiresTow: false,
    },
    {
        id: 'missing_person',
        dept: 'police',
        type: 'MISSING PERSON',
        description: 'Individual reported missing by family member.',
        priority: 'medium',
        onSceneTime: 400,
        requiresTow: false,
    },
    {
        id: 'welfare_check',
        dept: 'police',
        type: 'WELFARE CHECK',
        description: 'Caller concerned for wellbeing of neighbor.',
        priority: 'medium',
        onSceneTime: 160,
        requiresTow: false,
        requiresAmbulance: true,
    },
    {
        id: 'shots_fired',
        dept: 'police',
        type: 'SHOTS FIRED',
        description: 'Multiple callers reporting gunshots in area.',
        priority: 'critical',
        onSceneTime: 480,
        requiresTow: false,
        requiresAmbulance: true,
    },
    {
        id: 'dui',
        dept: 'police',
        type: 'DUI SUSPECT',
        description: 'Impaired driver reported by multiple motorists.',
        priority: 'high',
        onSceneTime: 220,
        requiresTow: true,
    },
    {
        id: 'trespassing',
        dept: 'police',
        type: 'TRESPASSING',
        description: 'Individual refusing to leave private property.',
        priority: 'low',
        onSceneTime: 140,
        requiresTow: false,
    },

    // ===== FIRE =====
    {
        id: 'structure_fire',
        dept: 'fire',
        type: 'STRUCTURE FIRE',
        description: 'Building fire reported with visible smoke.',
        priority: 'critical',
        onSceneTime: 600,
        requiresAmbulance: true,
    },
    {
        id: 'vehicle_fire',
        dept: 'fire',
        type: 'VEHICLE FIRE',
        description: 'Car fully engulfed on roadway.',
        priority: 'high',
        onSceneTime: 360,
        requiresTow: true,
    },
    {
        id: 'gas_leak',
        dept: 'fire',
        type: 'GAS LEAK',
        description: 'Natural gas odor reported at residential address.',
        priority: 'high',
        onSceneTime: 400,
        requiresUtility: true,
    },
    {
        id: 'brush_fire',
        dept: 'fire',
        type: 'BRUSH FIRE',
        description: 'Wildland fire spreading near residential area.',
        priority: 'high',
        onSceneTime: 500,
    },
    {
        id: 'explosion',
        dept: 'fire',
        type: 'EXPLOSION REPORTED',
        description: 'Explosion reported with fire and possible casualties.',
        priority: 'critical',
        onSceneTime: 720,
        requiresAmbulance: true,
        requiresUtility: true,
    },
    {
        id: 'fire_alarm',
        dept: 'fire',
        type: 'FIRE ALARM',
        description: 'Automatic alarm activation at commercial building.',
        priority: 'medium',
        onSceneTime: 180,
    },
    {
        id: 'smoke_investigation',
        dept: 'fire',
        type: 'SMOKE INVESTIGATION',
        description: 'Smoke visible from unknown source.',
        priority: 'medium',
        onSceneTime: 200,
    },
    {
        id: 'hazmat',
        dept: 'fire',
        type: 'HAZMAT INCIDENT',
        description: 'Chemical spill reported at industrial facility.',
        priority: 'critical',
        onSceneTime: 800,
        requiresUtility: true,
    },
    {
        id: 'electrical_fire',
        dept: 'fire',
        type: 'ELECTRICAL FIRE',
        description: 'Sparking wires causing fire in residential area.',
        priority: 'high',
        onSceneTime: 350,
        requiresUtility: true,
    },
    {
        id: 'dumpster_fire',
        dept: 'fire',
        type: 'DUMPSTER FIRE',
        description: 'Refuse container fire behind commercial property.',
        priority: 'low',
        onSceneTime: 120,
    },
    {
        id: 'rescue_trapped',
        dept: 'fire',
        type: 'RESCUE — PERSON TRAPPED',
        description: 'Individual trapped in vehicle or structure.',
        priority: 'critical',
        onSceneTime: 560,
        requiresAmbulance: true,
    },
    {
        id: 'carbon_monoxide',
        dept: 'fire',
        type: 'CARBON MONOXIDE ALARM',
        description: 'CO detector activation with occupants inside.',
        priority: 'high',
        onSceneTime: 240,
        requiresAmbulance: true,
    },

    // ===== AMBULANCE =====
    {
        id: 'cardiac_arrest',
        dept: 'ambulance',
        type: 'CARDIAC ARREST',
        description: 'Patient unresponsive, CPR in progress by bystander.',
        priority: 'critical',
        onSceneTime: 480,
        requiresPolice: true,
    },
    {
        id: 'stroke',
        dept: 'ambulance',
        type: 'STROKE SYMPTOMS',
        description: 'Patient displaying signs of stroke.',
        priority: 'critical',
        onSceneTime: 300,
    },
    {
        id: 'trauma',
        dept: 'ambulance',
        type: 'TRAUMA — MAJOR',
        description: 'Severe injuries from fall or impact.',
        priority: 'high',
        onSceneTime: 360,
    },
    {
        id: 'overdose',
        dept: 'ambulance',
        type: 'DRUG OVERDOSE',
        description: 'Unconscious patient, suspected overdose.',
        priority: 'critical',
        onSceneTime: 400,
        requiresPolice: true,
    },
    {
        id: 'allergic_reaction',
        dept: 'ambulance',
        type: 'ALLERGIC REACTION',
        description: 'Severe allergic reaction, possible anaphylaxis.',
        priority: 'high',
        onSceneTime: 240,
    },
    {
        id: 'chest_pain',
        dept: 'ambulance',
        type: 'CHEST PAIN',
        description: 'Patient reporting chest pain and shortness of breath.',
        priority: 'high',
        onSceneTime: 280,
    },
    {
        id: 'diabetic_emergency',
        dept: 'ambulance',
        type: 'DIABETIC EMERGENCY',
        description: 'Patient with altered consciousness, diabetic history.',
        priority: 'high',
        onSceneTime: 200,
    },
    {
        id: 'fall_injury',
        dept: 'ambulance',
        type: 'FALL WITH INJURY',
        description: 'Elderly patient fallen, unable to get up.',
        priority: 'medium',
        onSceneTime: 220,
    },
    {
        id: 'seizure',
        dept: 'ambulance',
        type: 'SEIZURE',
        description: 'Active seizure reported by family member.',
        priority: 'high',
        onSceneTime: 260,
    },
    {
        id: 'respiratory',
        dept: 'ambulance',
        type: 'RESPIRATORY DISTRESS',
        description: 'Patient having difficulty breathing.',
        priority: 'high',
        onSceneTime: 240,
    },
    {
        id: 'mvc_injuries',
        dept: 'ambulance',
        type: 'MVC WITH INJURIES',
        description: 'Motor vehicle collision with reported injuries.',
        priority: 'high',
        onSceneTime: 320,
        requiresPolice: true,
        requiresTow: true,
    },
    {
        id: 'unconscious',
        dept: 'ambulance',
        type: 'UNCONSCIOUS PERSON',
        description: 'Individual found unresponsive in public.',
        priority: 'critical',
        onSceneTime: 360,
        requiresPolice: true,
    },
    {
        id: 'minor_injury',
        dept: 'ambulance',
        type: 'MINOR INJURY',
        description: 'Non-life threatening injury requiring evaluation.',
        priority: 'low',
        onSceneTime: 140,
    },
    {
        id: 'childbirth',
        dept: 'ambulance',
        type: 'IMMINENT CHILDBIRTH',
        description: 'Patient in active labor, cannot transport safely.',
        priority: 'critical',
        onSceneTime: 500,
    },

    // ===== TOW =====
    {
        id: 'abandoned_vehicle',
        dept: 'tow',
        type: 'ABANDONED VEHICLE',
        description: 'Vehicle left unattended blocking traffic.',
        priority: 'low',
        onSceneTime: 180,
    },
    {
        id: 'accident_recovery',
        dept: 'tow',
        type: 'ACCIDENT RECOVERY',
        description: 'Disabled vehicle following collision needs removal.',
        priority: 'medium',
        onSceneTime: 240,
    },
    {
        id: 'breakdown_highway',
        dept: 'tow',
        type: 'HIGHWAY BREAKDOWN',
        description: 'Vehicle stalled on highway creating hazard.',
        priority: 'high',
        onSceneTime: 200,
    },
    {
        id: 'illegal_parking',
        dept: 'tow',
        type: 'ILLEGAL PARKING',
        description: 'Vehicle blocking fire hydrant or emergency access.',
        priority: 'medium',
        onSceneTime: 160,
    },
    {
        id: 'rollover_recovery',
        dept: 'tow',
        type: 'ROLLOVER RECOVERY',
        description: 'Overturned vehicle requires heavy tow equipment.',
        priority: 'high',
        onSceneTime: 360,
    },
    {
        id: 'flood_recovery',
        dept: 'tow',
        type: 'FLOOD VEHICLE RECOVERY',
        description: 'Vehicle submerged or stranded in flooded roadway.',
        priority: 'medium',
        onSceneTime: 300,
    },
    {
        id: 'impound',
        dept: 'tow',
        type: 'POLICE IMPOUND',
        description: 'Vehicle ordered impounded following arrest.',
        priority: 'low',
        onSceneTime: 200,
    },
    {
        id: 'debris_removal',
        dept: 'tow',
        type: 'ROAD DEBRIS REMOVAL',
        description: 'Large debris on roadway creating hazard.',
        priority: 'medium',
        onSceneTime: 140,
    },

    // ===== UTILITY =====
    {
        id: 'power_outage',
        dept: 'utility',
        type: 'POWER OUTAGE',
        description: 'Multiple blocks reporting loss of electrical service.',
        priority: 'medium',
        onSceneTime: 400,
    },
    {
        id: 'downed_power_line',
        dept: 'utility',
        type: 'DOWNED POWER LINE',
        description: 'Energized line on roadway, area must be cleared.',
        priority: 'critical',
        onSceneTime: 480,
        requiresPolice: true,
    },
    {
        id: 'water_main_break',
        dept: 'utility',
        type: 'WATER MAIN BREAK',
        description: 'Major water main rupture flooding street.',
        priority: 'high',
        onSceneTime: 560,
    },
    {
        id: 'transformer_fire',
        dept: 'utility',
        type: 'TRANSFORMER FIRE',
        description: 'Electrical transformer sparking and smoking.',
        priority: 'high',
        onSceneTime: 400,
        requiresFire: true,
    },
    {
        id: 'sewer_overflow',
        dept: 'utility',
        type: 'SEWER OVERFLOW',
        description: 'Sewage backing up into street and properties.',
        priority: 'medium',
        onSceneTime: 480,
    },
    {
        id: 'traffic_signal',
        dept: 'utility',
        type: 'TRAFFIC SIGNAL OUTAGE',
        description: 'Multiple traffic signals dark at busy intersection.',
        priority: 'medium',
        onSceneTime: 200,
        requiresPolice: true,
    },
    {
        id: 'gas_main_break',
        dept: 'utility',
        type: 'GAS MAIN BREAK',
        description: 'Ruptured gas main, evacuations underway.',
        priority: 'critical',
        onSceneTime: 600,
        requiresFire: true,
        requiresPolice: true,
    },
    {
        id: 'street_light',
        dept: 'utility',
        type: 'STREET LIGHT OUTAGE',
        description: 'Multiple street lights out creating unsafe conditions.',
        priority: 'low',
        onSceneTime: 160,
    },
    {
        id: 'telecom_outage',
        dept: 'utility',
        type: 'TELECOM LINE DOWN',
        description: 'Fallen cable line blocking sidewalk and roadway.',
        priority: 'low',
        onSceneTime: 200,
    },
    {
        id: 'flooding',
        dept: 'utility',
        type: 'STORM DRAIN FLOODING',
        description: 'Blocked storm drain causing street flooding.',
        priority: 'medium',
        onSceneTime: 340,
    },
];

// =====================
// STREET NAMES
// =====================

const STREETS = [
    'Main St', 'Oak Ave', 'Elm St', 'Park Blvd', 'Cedar Ln',
    'Maple Dr', 'Washington Ave', 'Lincoln Blvd', 'Highland Rd',
    'River Rd', 'Lake Dr', 'Forest Ave', 'Valley Rd', 'Hill St',
    'Church St', 'School Rd', 'Mill Rd', 'Spring St', 'West Ave',
    'North St', 'South Blvd', 'East Dr', 'Union St', 'Center Ave',
    'Commerce Blvd', 'Industrial Pkwy', 'Harbor Dr', 'Airport Rd',
    'Stadium Way', 'University Ave',
];

const CROSS_STREETS = [
    '1st', '2nd', '3rd', '4th', '5th',
    '6th', '7th', '8th', '9th', '10th',
];

// =====================
// HELPERS
// =====================

function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateLocation() {
    const street = randomFrom(STREETS);
    const cross = randomFrom(CROSS_STREETS);
    return `${cross} & ${street}`;
}

function generateId() {
    return 'INC-' + Date.now().toString().slice(-6);
}

// =====================
// GENERATE INCIDENT
// =====================

export function generateIncident() {
    // Weight toward lower priority for realism
    const pool = [
        ...INCIDENT_TYPES.filter(t => t.priority === 'low'),
        ...INCIDENT_TYPES.filter(t => t.priority === 'low'),
        ...INCIDENT_TYPES.filter(t => t.priority === 'medium'),
        ...INCIDENT_TYPES.filter(t => t.priority === 'medium'),
        ...INCIDENT_TYPES.filter(t => t.priority === 'high'),
        ...INCIDENT_TYPES.filter(t => t.priority === 'critical'),
    ];

    const template = randomFrom(pool);

    return {
        id: generateId(),
        type: template.type,
        dept: template.dept,
        description: template.description,
        priority: template.priority,
        location: generateLocation(),
        x: Math.floor(Math.random() * 28) + 1,
        y: Math.floor(Math.random() * 28) + 1,
        onSceneTime: template.onSceneTime,
        requiresTow: template.requiresTow || false,
        requiresAmbulance: template.requiresAmbulance || false,
        requiresPolice: template.requiresPolice || false,
        requiresFire: template.requiresFire || false,
        requiresUtility: template.requiresUtility || false,
        status: 'pending',  // pending | assigned | onscene | resolved
        assignedUnits: [],
        createdAt: state.sim.time,
        dispatchedAt: null,
        resolvedAt: null,
        towRequested: false,
    };
}

// =====================
// ADD INCIDENT
// =====================

export function addIncident(incident) {
    state.incidents.active.push(incident);
    state.stats.totalIncidents++;
    state.stats.byPriority[incident.priority].total++;
    addRadioMessage('newincident', null, incident);

    // Sound
    if (incident.priority === 'critical') {
        play(playCriticalTone);
    } else if (incident.priority === 'high') {
        play(playDispatchTone);
    }
}

// =====================
// DISPATCH TO INCIDENT
// =====================

export function dispatchToIncident(incidentId, unitId) {
    const incident = state.incidents.active.find(i => i.id === incidentId);
    if (!incident) return { success: false, message: 'Incident not found.' };

    const success = dispatchUnit(unitId, incident);
    if (!success) return { success: false, message: 'Unit unavailable.' };

    incident.assignedUnits.push(unitId);
    incident.status = 'assigned';
    incident.dispatchedAt = incident.dispatchedAt || state.sim.time;

    return { success: true };
}

// =====================
// AUTO DISPATCH
// =====================

export function autoDispatch(incident) {
    const unit = getNearestAvailableUnit(incident.dept, incident);
    if (!unit) return false;

    const result = dispatchToIncident(incident.id, unit.id);

    // Set on scene time on the unit
    if (result.success) {
        const u = state.units.find(u => u.id === unit.id);
        if (u) u.onSceneMax = incident.onSceneTime;
    }

    return result.success;
}

// =====================
// RESOLVE INCIDENT
// =====================

export function resolveIncident(incidentId) {
    const index = state.incidents.active.findIndex(i => i.id === incidentId);
    if (index === -1) return;

    const incident = state.incidents.active[index];
    incident.status = 'resolved';
    incident.resolvedAt = state.sim.time;

    // Calculate response time
    if (incident.dispatchedAt !== null) {
        const responseTime = incident.dispatchedAt - incident.createdAt;
        state.stats.totalResponseTime += responseTime;
        state.stats.totalResolved++;
        state.stats.avgResponseTime = Math.floor(
            state.stats.totalResponseTime / state.stats.totalResolved
        );
    }

    state.stats.byDepartment[incident.dept].resolved++;
    state.stats.byPriority[incident.priority].resolved++;

    // Move to resolved
    state.incidents.active.splice(index, 1);
    state.incidents.resolved.push(incident);
    play(playAllClear);
}

// =====================
// TICK INCIDENTS
// =====================

export function tickIncidents() {
    state.incidents.active.forEach(incident => {
        if (incident.status !== 'onscene') return;

        // Check if all assigned units have finished
        const assignedUnits = state.units.filter(
            u => incident.assignedUnits.includes(u.id)
        );

        const allReturning = assignedUnits.every(
            u => u.status === 'returning' || u.status === 'available'
        );

        if (allReturning && assignedUnits.length > 0) {
            resolveIncident(incident.id);
        }
    });

    // Update incident status to onscene when unit arrives
    state.incidents.active.forEach(incident => {
        if (incident.status !== 'assigned') return;

        const assignedUnits = state.units.filter(
            u => incident.assignedUnits.includes(u.id)
        );

        const anyOnScene = assignedUnits.some(u => u.status === 'onscene');
        if (anyOnScene) incident.status = 'onscene';
    });
}

// =====================
// SHOULD SPAWN INCIDENT
// =====================

export function shouldSpawnIncident() {
    const active = state.incidents.active.length;
    const maxActive = 12;

    if (active >= maxActive) return false;

    // Cooldown — minimum 3 seconds between spawns
    if (!state._lastSpawnTime) state._lastSpawnTime = 0;
    const timeSinceLast = state.sim.time - state._lastSpawnTime;
    if (timeSinceLast < 3) return false;

    const baseChance = 0.008 * state.sim.speed;
    if (Math.random() < baseChance) {
        state._lastSpawnTime = state.sim.time;
        return true;
    }

    return false;
}