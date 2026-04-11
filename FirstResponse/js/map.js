// =====================
// MAP.JS
// Canvas city grid renderer
// with A* pathfinding
// =====================

import { state, DEPT_CONFIG } from './state.js';

// =====================
// CANVAS SETUP
// =====================

let canvas, ctx, cellSize;

export function initMap() {
    canvas = document.getElementById('city-map');
    ctx = canvas.getContext('2d');

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('click', onMapClick);
    canvas.addEventListener('mouseleave', () => hideTooltip());
}

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    cellSize = Math.min(
        canvas.width / state.map.width,
        canvas.height / state.map.height
    );
}

// =====================
// ROAD NETWORK
// =====================

// Road positions on the 30x30 grid
export const ROADS = {
    horizontal: [3, 7, 11, 15, 19, 23, 27],
    vertical: [3, 7, 11, 15, 19, 23, 27],
};

// Get all road intersections
function getIntersections() {
    const nodes = [];
    ROADS.horizontal.forEach(y => {
        ROADS.vertical.forEach(x => {
            nodes.push({ x, y });
        });
    });
    return nodes;
}

// Check if a position is on a road
export function isOnRoad(x, y) {
    const rx = Math.round(x);
    const ry = Math.round(y);
    return ROADS.horizontal.includes(ry) || ROADS.vertical.includes(rx);
}

// Get nearest road intersection to a point
export function getNearestIntersection(x, y) {
    let nearest = null;
    let minDist = Infinity;

    ROADS.vertical.forEach(rx => {
        ROADS.horizontal.forEach(ry => {
            const dist = Math.sqrt((x - rx) ** 2 + (y - ry) ** 2);
            if (dist < minDist) {
                minDist = dist;
                nearest = { x: rx, y: ry };
            }
        });
    });

    return nearest;
}

// =====================
// A* PATHFINDING
// =====================

function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function getNeighbors(node) {
    const neighbors = [];
    const { x, y } = node;

    // Can move along horizontal roads
    if (ROADS.horizontal.includes(y)) {
        ROADS.vertical.forEach(nx => {
            if (nx !== x) neighbors.push({ x: nx, y });
        });
    }

    // Can move along vertical roads
    if (ROADS.vertical.includes(x)) {
        ROADS.horizontal.forEach(ny => {
            if (ny !== y) neighbors.push({ x, y: ny });
        });
    }

    return neighbors;
}

export function findPath(startX, startY, endX, endY) {
    const start = getNearestIntersection(startX, startY);
    const end = getNearestIntersection(endX, endY);

    if (!start || !end) return [];
    if (start.x === end.x && start.y === end.y) return [end];

    const key = n => `${n.x},${n.y}`;
    const open = [{ ...start, g: 0, h: heuristic(start, end), f: heuristic(start, end), parent: null }];
    const closed = new Set();
    const gScore = { [key(start)]: 0 };

    while (open.length > 0) {
        // Get node with lowest f score
        open.sort((a, b) => a.f - b.f);
        const current = open.shift();

        if (current.x === end.x && current.y === end.y) {
            // Reconstruct path
            const path = [];
            let node = current;
            while (node) {
                path.unshift({ x: node.x, y: node.y });
                node = node.parent;
            }
            // Add final destination
            path.push({ x: endX, y: endY });
            return path;
        }

        closed.add(key(current));

        const neighbors = getNeighbors(current);
        neighbors.forEach(neighbor => {
            if (closed.has(key(neighbor))) return;

            const g = gScore[key(current)] + heuristic(current, neighbor);

            if (gScore[key(neighbor)] === undefined || g < gScore[key(neighbor)]) {
                gScore[key(neighbor)] = g;
                const h = heuristic(neighbor, end);
                open.push({
                    ...neighbor,
                    g, h,
                    f: g + h,
                    parent: current,
                });
            }
        });
    }

    return [{ x: endX, y: endY }];
}

// =====================
// LANDMARKS
// =====================

const LANDMARKS = [
    { x: 4, y: 4, type: 'police', label: 'PD HQ' },
    { x: 25, y: 4, type: 'fire', label: 'FIRE HQ' },
    { x: 4, y: 25, type: 'ambulance', label: 'HOSPITAL' },
    { x: 25, y: 25, type: 'tow', label: 'TOW YARD' },
    { x: 13, y: 13, type: 'utility', label: 'UTIL HQ' },
    { x: 13, y: 5, type: 'building', label: 'CITY HALL' },
    { x: 5, y: 13, type: 'building', label: 'COURTHOUSE' },
    { x: 25, y: 13, type: 'building', label: 'STADIUM' },
    { x: 13, y: 25, type: 'building', label: 'MALL' },
    { x: 9, y: 9, type: 'building', label: 'SCHOOL' },
    { x: 21, y: 9, type: 'building', label: 'BANK' },
    { x: 9, y: 21, type: 'building', label: 'PARK' },
    { x: 21, y: 21, type: 'building', label: 'MARKET' },
];

// =====================
// ZONES
// =====================

const ZONES = [
    { x: 0, y: 0, w: 11, h: 11, color: 'rgba(59,130,246,0.06)', label: 'NORTH WEST' },
    { x: 19, y: 0, w: 11, h: 11, color: 'rgba(239,68,68,0.06)', label: 'NORTH EAST' },
    { x: 0, y: 19, w: 11, h: 11, color: 'rgba(34,197,94,0.06)', label: 'SOUTH WEST' },
    { x: 19, y: 19, w: 11, h: 11, color: 'rgba(249,115,22,0.06)', label: 'SOUTH EAST' },
    { x: 11, y: 11, w: 8, h: 8, color: 'rgba(234,179,8,0.06)', label: 'CENTRAL' },
];

// =====================
// MAIN DRAW
// =====================

export function drawMap() {
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();
    drawZones();
    drawBlocks();
    drawRoads();
    drawGridCoords();
    drawLandmarks();
    drawBases();
    drawIncidents();
    drawUnits();
}

// =====================
// BACKGROUND
// =====================

function drawBackground() {
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// =====================
// ZONES
// =====================

function drawZones() {
    ZONES.forEach(zone => {
        ctx.fillStyle = zone.color;
        ctx.fillRect(
            zone.x * cellSize,
            zone.y * cellSize,
            zone.w * cellSize,
            zone.h * cellSize
        );

        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.font = `bold ${cellSize * 0.4}px IBM Plex Mono, monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(
            zone.label,
            (zone.x + zone.w / 2) * cellSize,
            (zone.y + zone.h / 2) * cellSize
        );
    });
}

// =====================
// CITY BLOCKS
// =====================

function drawBlocks() {
    // Fill areas between roads with slightly lighter color
    // to simulate city blocks
    for (let i = 0; i < ROADS.vertical.length - 1; i++) {
        for (let j = 0; j < ROADS.horizontal.length - 1; j++) {
            const x1 = ROADS.vertical[i] + 0.5;
            const x2 = ROADS.vertical[i + 1] - 0.5;
            const y1 = ROADS.horizontal[j] + 0.5;
            const y2 = ROADS.horizontal[j + 1] - 0.5;

            ctx.fillStyle = 'rgba(255,255,255,0.02)';
            ctx.fillRect(
                x1 * cellSize,
                y1 * cellSize,
                (x2 - x1) * cellSize,
                (y2 - y1) * cellSize
            );
        }
    }
}

// =====================
// ROADS
// =====================

function drawRoads() {
    // Road fill
    ctx.fillStyle = '#1a2540';

    ROADS.horizontal.forEach(y => {
        ctx.fillRect(
            0,
            (y - 0.4) * cellSize,
            state.map.width * cellSize,
            0.8 * cellSize
        );
    });

    ROADS.vertical.forEach(x => {
        ctx.fillRect(
            (x - 0.4) * cellSize,
            0,
            0.8 * cellSize,
            state.map.height * cellSize
        );
    });

    // Road edge lines
    ctx.strokeStyle = '#263354';
    ctx.lineWidth = 0.5;

    ROADS.horizontal.forEach(y => {
        ctx.beginPath();
        ctx.moveTo(0, (y - 0.4) * cellSize);
        ctx.lineTo(state.map.width * cellSize, (y - 0.4) * cellSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, (y + 0.4) * cellSize);
        ctx.lineTo(state.map.width * cellSize, (y + 0.4) * cellSize);
        ctx.stroke();
    });

    ROADS.vertical.forEach(x => {
        ctx.beginPath();
        ctx.moveTo((x - 0.4) * cellSize, 0);
        ctx.lineTo((x - 0.4) * cellSize, state.map.height * cellSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo((x + 0.4) * cellSize, 0);
        ctx.lineTo((x + 0.4) * cellSize, state.map.height * cellSize);
        ctx.stroke();
    });

    // Center dashes
    ctx.strokeStyle = '#2e4060';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([cellSize * 0.3, cellSize * 0.3]);

    ROADS.horizontal.forEach(y => {
        ctx.beginPath();
        ctx.moveTo(0, y * cellSize);
        ctx.lineTo(state.map.width * cellSize, y * cellSize);
        ctx.stroke();
    });

    ROADS.vertical.forEach(x => {
        ctx.beginPath();
        ctx.moveTo(x * cellSize, 0);
        ctx.lineTo(x * cellSize, state.map.height * cellSize);
        ctx.stroke();
    });

    ctx.setLineDash([]);

    // Intersection highlights
    ROADS.vertical.forEach(x => {
        ROADS.horizontal.forEach(y => {
            ctx.fillStyle = '#1e2d45';
            ctx.fillRect(
                (x - 0.4) * cellSize,
                (y - 0.4) * cellSize,
                0.8 * cellSize,
                0.8 * cellSize
            );
        });
    });
}

// =====================
// GRID COORDINATES
// =====================

function drawGridCoords() {
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.font = `${cellSize * 0.25}px IBM Plex Mono, monospace`;
    ctx.textAlign = 'center';

    ROADS.vertical.forEach(x => {
        ctx.fillText(`${x}`, x * cellSize, cellSize * 0.4);
    });

    ctx.textAlign = 'right';
    ROADS.horizontal.forEach(y => {
        ctx.fillText(`${y}`, cellSize * 0.4, y * cellSize + cellSize * 0.1);
    });
}

// =====================
// LANDMARKS
// =====================

function drawLandmarks() {
    LANDMARKS.forEach(lm => {
        const px = lm.x * cellSize;
        const py = lm.y * cellSize;
        const size = cellSize * 0.7;
        const color = lm.type === 'building'
            ? '#2a3550'
            : DEPT_CONFIG[lm.type]?.color + '44' || '#2a3550';

        // Building block
        ctx.fillStyle = color;
        ctx.strokeStyle = lm.type === 'building'
            ? '#3d4f6e'
            : DEPT_CONFIG[lm.type]?.color + '88' || '#3d4f6e';
        ctx.lineWidth = 0.5;

        ctx.fillRect(
            px - size / 2,
            py - size / 2,
            size,
            size
        );
        ctx.strokeRect(
            px - size / 2,
            py - size / 2,
            size,
            size
        );

        // Label
        ctx.fillStyle = lm.type === 'building'
            ? 'rgba(255,255,255,0.3)'
            : DEPT_CONFIG[lm.type]?.color || 'rgba(255,255,255,0.3)';
        ctx.font = `bold ${cellSize * 0.22}px IBM Plex Mono, monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(lm.label, px, py + cellSize * 0.1);
    });
}

// =====================
// BASES
// =====================

function drawBases() {
    Object.entries(state.map.bases).forEach(([dept, pos]) => {
        const px = pos.x * cellSize;
        const py = pos.y * cellSize;
        const color = DEPT_CONFIG[dept].color;
        const size = cellSize * 0.4;

        // Pulse ring
        ctx.beginPath();
        ctx.arc(px, py, size * 1.8, 0, Math.PI * 2);
        ctx.strokeStyle = color + '33';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Base marker
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = color + '22';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Dept initial
        ctx.fillStyle = color;
        ctx.font = `bold ${cellSize * 0.3}px IBM Plex Mono, monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(
            dept.slice(0, 1).toUpperCase(),
            px,
            py + cellSize * 0.1
        );
    });
}

// =====================
// INCIDENTS
// =====================

function drawIncidents() {
    state.incidents.active.forEach(incident => {
        const px = incident.x * cellSize;
        const py = incident.y * cellSize;
        const r = cellSize * 0.35;

        const priorityColor = {
            critical: '#ff0000',
            high: '#ef4444',
            medium: '#eab308',
            low: '#22c55e',
        }[incident.priority];

        // Pulse for critical
        if (incident.priority === 'critical') {
            const pulse = (Math.sin(Date.now() / 300) + 1) / 2;
            ctx.beginPath();
            ctx.arc(px, py, r * (1.8 + pulse * 0.5), 0, Math.PI * 2);
            ctx.strokeStyle = priorityColor + '55';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Incident circle
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = priorityColor + '33';
        ctx.fill();
        ctx.strokeStyle = priorityColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Cross marker
        ctx.strokeStyle = priorityColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px - r * 0.5, py);
        ctx.lineTo(px + r * 0.5, py);
        ctx.moveTo(px, py - r * 0.5);
        ctx.lineTo(px, py + r * 0.5);
        ctx.stroke();

        // Incident type label
        ctx.fillStyle = priorityColor;
        ctx.font = `${cellSize * 0.2}px IBM Plex Mono, monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(
            incident.type.slice(0, 10),
            px,
            py + r + cellSize * 0.25
        );
    });
}

// =====================
// UNITS
// =====================

function drawUnits() {
    state.units.forEach(unit => {
        const px = unit.x * cellSize;
        const py = unit.y * cellSize;
        const r = cellSize * 0.25;
        const color = DEPT_CONFIG[unit.dept].color;

        // Path line
        if (unit.path && unit.path.length > 0 &&
            (unit.status === 'dispatched' || unit.status === 'returning')) {
            ctx.beginPath();
            ctx.moveTo(px, py);
            unit.path.forEach(node => {
                ctx.lineTo(node.x * cellSize, node.y * cellSize);
            });
            ctx.strokeStyle = color + '33';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Unit circle
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Onscene ring
        if (unit.status === 'onscene') {
            ctx.beginPath();
            ctx.arc(px, py, r * 1.8, 0, Math.PI * 2);
            ctx.strokeStyle = color + '88';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // Unit ID
        ctx.fillStyle = '#000000';
        ctx.font = `bold ${cellSize * 0.18}px IBM Plex Mono, monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(unit.id, px, py + cellSize * 0.07);
    });
}

// =====================
// MOUSE EVENTS
// =====================

function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const gridX = mx / cellSize;
    const gridY = my / cellSize;

    // Update coords display
    const coords = document.getElementById('map-coords');
    if (coords) {
        coords.textContent = `GRID ${Math.floor(gridX)},${Math.floor(gridY)}`;
    }

    // Clear previous timer
    if (tooltipTimer) clearTimeout(tooltipTimer);

    // Check hover targets
    const hoveredUnit = state.units.find(u =>
        Math.abs(u.x - gridX) < 0.6 && Math.abs(u.y - gridY) < 0.6
    );

    if (hoveredUnit) {
        const incident = hoveredUnit.incidentId
            ? state.incidents.active.find(i => i.id === hoveredUnit.incidentId)
            : null;

        showTooltip(`
      <div class="tt-title" style="color:${DEPT_CONFIG[hoveredUnit.dept].color}">
        ${hoveredUnit.id}
      </div>
      <div class="tt-row">
        <span class="tt-label">DEPT</span>
        <span class="tt-value">${hoveredUnit.dept.toUpperCase()}</span>
      </div>
      <div class="tt-row">
        <span class="tt-label">STATUS</span>
        <span class="tt-value tt-status--${hoveredUnit.status}">
          ${hoveredUnit.status.toUpperCase()}
        </span>
      </div>
      ${incident ? `
        <div class="tt-row">
          <span class="tt-label">ASSIGNED</span>
          <span class="tt-value">${incident.type}</span>
        </div>
        <div class="tt-row">
          <span class="tt-label">LOCATION</span>
          <span class="tt-value">${incident.location}</span>
        </div>
      ` : ''}
    `, mx, my);
        return;
    }

    const hoveredIncident = state.incidents.active.find(i =>
        Math.abs(i.x - gridX) < 0.8 && Math.abs(i.y - gridY) < 0.8
    );

    if (hoveredIncident) {
        const assignedUnits = state.units.filter(
            u => hoveredIncident.assignedUnits.includes(u.id)
        );

        const priorityColor = {
            critical: '#ff0000',
            high: '#ef4444',
            medium: '#eab308',
            low: '#22c55e',
        }[hoveredIncident.priority];

        showTooltip(`
      <div class="tt-title" style="color:${priorityColor}">
        ${hoveredIncident.type}
      </div>
      <div class="tt-row">
        <span class="tt-label">ID</span>
        <span class="tt-value">${hoveredIncident.id}</span>
      </div>
      <div class="tt-row">
        <span class="tt-label">PRIORITY</span>
        <span class="tt-value" style="color:${priorityColor}">
          ${hoveredIncident.priority.toUpperCase()}
        </span>
      </div>
      <div class="tt-row">
        <span class="tt-label">STATUS</span>
        <span class="tt-value">${hoveredIncident.status.toUpperCase()}</span>
      </div>
      <div class="tt-row">
        <span class="tt-label">LOCATION</span>
        <span class="tt-value">${hoveredIncident.location}</span>
      </div>
      <div class="tt-row">
        <span class="tt-label">DESC</span>
        <span class="tt-value tt-desc">${hoveredIncident.description}</span>
      </div>
      ${assignedUnits.length > 0 ? `
        <div class="tt-row">
          <span class="tt-label">UNITS</span>
          <span class="tt-value">
            ${assignedUnits.map(u => `
              <span style="color:${DEPT_CONFIG[u.dept].color}">${u.id}</span>
            `).join(' ')}
          </span>
        </div>
      ` : ''}
      <div class="tt-hint">CLICK TO DISPATCH</div>
    `, mx, my);
        return;
    }

    // Check hover over base
    const hoveredBase = Object.entries(state.map.bases).find(([dept, pos]) =>
        Math.abs(pos.x - gridX) < 0.8 && Math.abs(pos.y - gridY) < 0.8
    );

    if (hoveredBase) {
        const [dept, pos] = hoveredBase;
        const units = state.units.filter(u => u.dept === dept);
        const available = units.filter(u => u.status === 'available').length;
        const color = DEPT_CONFIG[dept].color;

        showTooltip(`
      <div class="tt-title" style="color:${color}">
        ${dept.toUpperCase()} BASE
      </div>
      <div class="tt-row">
        <span class="tt-label">AVAILABLE</span>
        <span class="tt-value" style="color:var(--success)">
          ${available}/${units.length}
        </span>
      </div>
      <div class="tt-row">
        <span class="tt-label">DISPATCHED</span>
        <span class="tt-value">
          ${units.filter(u => u.status === 'dispatched').length}
        </span>
      </div>
      <div class="tt-row">
        <span class="tt-label">ON SCENE</span>
        <span class="tt-value">
          ${units.filter(u => u.status === 'onscene').length}
        </span>
      </div>
      <div class="tt-row">
        <span class="tt-label">RETURNING</span>
        <span class="tt-value">
          ${units.filter(u => u.status === 'returning').length}
        </span>
      </div>
    `, mx, my);
        return;
    }

    hideTooltip();
}

function onMapClick(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const gridX = mx / cellSize;
    const gridY = my / cellSize;

    // Check if clicked near a unit
    const clickedUnit = state.units.find(u =>
        Math.abs(u.x - gridX) < 0.6 && Math.abs(u.y - gridY) < 0.6
    );

    if (clickedUnit) {
        window._selectedUnit = clickedUnit.id;
        window.dispatchEvent(new CustomEvent('unit-clicked', {
            detail: { unitId: clickedUnit.id }
        }));
        return;
    }

    // Check if clicked near an incident
    const clickedIncident = state.incidents.active.find(i =>
        Math.abs(i.x - gridX) < 0.8 && Math.abs(i.y - gridY) < 0.8
    );

    if (clickedIncident) {
        window._selectedIncident = clickedIncident.id;
        window.dispatchEvent(new CustomEvent('incident-clicked', {
            detail: { incidentId: clickedIncident.id }
        }));
    }
}

// =====================
// GRID TO PIXEL
// =====================

export function gridToPixel(x, y) {
    return {
        px: x * cellSize,
        py: y * cellSize,
    };
}

// =====================
// TOOLTIP
// =====================

let tooltip = null;
let tooltipTimer = null;

function initTooltip() {
    tooltip = document.createElement('div');
    tooltip.id = 'map-tooltip';
    tooltip.className = 'map-tooltip';
    document.querySelector('.map-container').appendChild(tooltip);
}

function showTooltip(html, x, y) {
    if (!tooltip) initTooltip();
    tooltip.innerHTML = html;
    tooltip.style.left = `${x + 12}px`;
    tooltip.style.top = `${y + 12}px`;
    tooltip.classList.add('map-tooltip--visible');
}

function hideTooltip() {
    if (!tooltip) return;
    tooltip.classList.remove('map-tooltip--visible');
}