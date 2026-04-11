// =====================
// STATS.JS
// Statistics and reporting
// =====================

import { state } from './state.js';
import { formatResponseTime } from './dispatch.js';

// =====================
// GET SUMMARY
// =====================

export function getStatsSummary() {
    const total = state.stats.totalIncidents;
    const resolved = state.stats.totalResolved;
    const active = state.incidents.active.length;
    const avgResp = formatResponseTime(state.stats.avgResponseTime);
    const rate = total > 0
        ? Math.floor((resolved / total) * 100)
        : 0;

    return {
        total,
        resolved,
        active,
        avgResp,
        rate,
    };
}

// =====================
// GET DEPARTMENT STATS
// =====================

export function getDeptStats() {
    return Object.entries(state.stats.byDepartment).map(([dept, data]) => {
        const rate = data.dispatched > 0
            ? Math.floor((data.resolved / data.dispatched) * 100)
            : 0;

        return {
            dept,
            dispatched: data.dispatched,
            resolved: data.resolved,
            rate,
        };
    });
}

// =====================
// GET PRIORITY STATS
// =====================

export function getPriorityStats() {
    return Object.entries(state.stats.byPriority).map(([priority, data]) => {
        const rate = data.total > 0
            ? Math.floor((data.resolved / data.total) * 100)
            : 0;

        return {
            priority,
            total: data.total,
            resolved: data.resolved,
            rate,
        };
    });
}

// =====================
// GET BUSIEST ZONES
// =====================

export function getBusiestZones() {
    const zones = {
        'DISTRICT 1': 0,
        'DISTRICT 2': 0,
        'DISTRICT 3': 0,
        'DISTRICT 4': 0,
        'CENTRAL': 0,
    };

    const allIncidents = [
        ...state.incidents.active,
        ...state.incidents.resolved,
    ];

    allIncidents.forEach(incident => {
        const zone = getZoneForPosition(incident.x, incident.y);
        if (zones[zone] !== undefined) zones[zone]++;
    });

    return Object.entries(zones)
        .map(([zone, count]) => ({ zone, count }))
        .sort((a, b) => b.count - a.count);
}

function getZoneForPosition(x, y) {
    if (x <= 7 && y <= 7) return 'DISTRICT 1';
    if (x >= 13 && y <= 7) return 'DISTRICT 2';
    if (x <= 7 && y >= 13) return 'DISTRICT 3';
    if (x >= 13 && y >= 13) return 'DISTRICT 4';
    return 'CENTRAL';
}

// =====================
// GET UNIT UTILIZATION
// =====================

export function getUnitUtilization() {
    return state.units.map(unit => {
        const statusLabel = {
            available: 'AVAILABLE',
            dispatched: 'DISPATCHED',
            onscene: 'ON SCENE',
            returning: 'RETURNING',
        }[unit.status] || 'UNKNOWN';

        return {
            id: unit.id,
            dept: unit.dept,
            status: unit.status,
            statusLabel,
            incidentId: unit.incidentId,
        };
    });
}

// =====================
// GET ACTIVE BREAKDOWN
// =====================

export function getActiveBreakdown() {
    const breakdown = {
        police: 0,
        fire: 0,
        ambulance: 0,
        tow: 0,
        utility: 0,
    };

    state.incidents.active.forEach(i => {
        if (breakdown[i.dept] !== undefined) breakdown[i.dept]++;
    });

    return breakdown;
}

// =====================
// GET RECENT RESOLVED
// =====================

export function getRecentResolved(limit = 20) {
    return [...state.incidents.resolved]
        .reverse()
        .slice(0, limit);
}

// =====================
// RENDER STATS PANEL
// =====================

export function renderStatsPanel() {
    const container = document.getElementById('stats-grid');
    if (!container) return;

    const summary = getStatsSummary();
    const deptStats = getDeptStats();
    const priority = getPriorityStats();
    const zones = getBusiestZones();

    container.innerHTML = `
    <div class="stats-card">
      <span class="stats-card__label">TOTAL INCIDENTS</span>
      <span class="stats-card__value">${summary.total}</span>
    </div>
    <div class="stats-card">
      <span class="stats-card__label">RESOLVED</span>
      <span class="stats-card__value" style="color:var(--success)">
        ${summary.resolved}
      </span>
    </div>
    <div class="stats-card">
      <span class="stats-card__label">ACTIVE</span>
      <span class="stats-card__value" style="color:var(--warning)">
        ${summary.active}
      </span>
    </div>
    <div class="stats-card">
      <span class="stats-card__label">RESOLVE RATE</span>
      <span class="stats-card__value">${summary.rate}%</span>
    </div>
    <div class="stats-card">
      <span class="stats-card__label">AVG RESPONSE</span>
      <span class="stats-card__value">${summary.avgResp}</span>
    </div>

    ${deptStats.map(d => `
      <div class="stats-card">
        <span class="stats-card__label">${d.dept.toUpperCase()}</span>
        <span class="stats-card__value">${d.resolved}/${d.dispatched}</span>
      </div>
    `).join('')}

    ${zones.map(z => `
      <div class="stats-card">
        <span class="stats-card__label">${z.zone}</span>
        <span class="stats-card__value">${z.count}</span>
      </div>
    `).join('')}
  `;
}