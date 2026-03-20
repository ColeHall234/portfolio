const API = 'http://localhost:3000/api';
let employees = [];
let shifts = [];
let current_week_start = get_week_start(new Date());

function get_token() {
    return localStorage.getItem('token');
}

function auth_headers() {
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + get_token()
    };
}

async function api(method, endpoint, body) {
    let options = { method, headers: auth_headers() };
    if (body) options.body = JSON.stringify(body);
    let res = await fetch(API + endpoint, options);
    if (res.status === 401) {
        logout();
        return null;
    }
    return res.json();
}

function logout() {
    localStorage.clear();
    window.location.href = 'auth.html';
}

function show_page(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.sidebar-nav-item').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + name).classList.add('active');
    event.currentTarget.classList.add('active');
}

function open_modal(id) { document.getElementById(id).classList.remove('hidden'); }
function close_modal(id) { document.getElementById(id).classList.add('hidden'); }

function show_alert(container_id, message, type) {
    document.getElementById(container_id).innerHTML =
        '<div class="alert alert-' + type + '">' + message + '</div>';
}

// ── Week helpers ──
function get_week_start(date) {
    let d = new Date(date);
    let day = d.getDay();
    let diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function format_date(date) {
    return date.toISOString().split('T')[0];
}

function format_display_date(date_str) {
    let d = new Date(date_str + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function change_week(direction) {
    current_week_start = new Date(current_week_start);
    current_week_start.setDate(current_week_start.getDate() + direction * 7);
    load_schedule();
}

// ── Load Data ──
async function load_employees() {
    employees = await api('GET', '/employees');
    if (!employees) return;
    render_employees();
    populate_shift_employee_select();
}

async function load_schedule() {
    let week_str = format_date(current_week_start);
    shifts = await api('GET', '/shifts?week_start=' + week_str);
    if (!shifts) return;
    render_schedule();
}

// ── Render Schedule ──
function render_schedule() {
    let grid = document.getElementById('schedule-grid');
    let days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    let week_dates = [];

    for (let i = 0; i < 7; i++) {
        let d = new Date(current_week_start);
        d.setDate(d.getDate() + i);
        week_dates.push(d);
    }

    let week_end = new Date(current_week_start);
    week_end.setDate(week_end.getDate() + 6);
    document.getElementById('week-label').innerText =
        format_display_date(format_date(current_week_start)) + ' — ' +
        format_display_date(format_date(week_end));

    let html = '<div class="schedule-header">Employee</div>';
    days.forEach(function (day, i) {
        html += '<div class="schedule-header">' + day + '<br><small>' +
            format_display_date(format_date(week_dates[i])) + '</small></div>';
    });

    if (employees.length === 0) {
        grid.innerHTML = html + '<div style="grid-column:1/-1;padding:40px;text-align:center;color:#94a3b8">Add employees to start scheduling</div>';
        return;
    }

    employees.forEach(function (emp) {
        html += '<div class="schedule-employee">' + emp.name + '</div>';
        week_dates.forEach(function (date) {
            let date_str = format_date(date);
            let day_shifts = shifts.filter(function (s) {
                return s.employee_id === emp.id && s.date === date_str;
            });
            html += '<div class="schedule-cell" onclick="open_add_shift(\'' + date_str + '\', ' + emp.id + ')">';
            day_shifts.forEach(function (shift) {
                html += '<div class="shift-block">' +
                    shift.start_time + ' - ' + shift.end_time +
                    '<button class="shift-delete" onclick="event.stopPropagation(); delete_shift(' + shift.id + ')">×</button>' +
                    '</div>';
            });
            html += '</div>';
        });
    });

    grid.innerHTML = html;
}

// ── Render Employees ──
function render_employees() {
    let grid = document.getElementById('employee-grid');
    if (employees.length === 0) {
        grid.innerHTML = '<div class="empty-state"><h3>No employees yet</h3><p>Add your first employee to get started.</p><button class="btn btn-primary" onclick="open_add_employee()">Add Employee</button></div>';
        return;
    }
    grid.innerHTML = employees.map(function (emp) {
        let initials = emp.name.split(' ').map(function (n) { return n[0]; }).join('').toUpperCase();
        return '<div class="employee-card">' +
            '<div class="employee-avatar">' + initials + '</div>' +
            '<div class="employee-info">' +
            '<div class="employee-name">' + emp.name + '</div>' +
            '<div class="employee-role">' + (emp.role || 'No role set') + '</div>' +
            '</div>' +
            '<div class="employee-actions">' +
            '<button class="btn btn-danger btn-sm" onclick="delete_employee(' + emp.id + ')">×</button>' +
            '</div>' +
            '</div>';
    }).join('');
}

function populate_shift_employee_select() {
    let select = document.getElementById('shift-employee');
    select.innerHTML = employees.map(function (emp) {
        return '<option value="' + emp.id + '">' + emp.name + '</option>';
    }).join('');
}

// ── Add Shift ──
function open_add_shift(date, employee_id) {
    document.getElementById('shift-date').value = date || format_date(new Date());
    if (employee_id) {
        document.getElementById('shift-employee').value = employee_id;
    }
    document.getElementById('shift-start').value = '09:00';
    document.getElementById('shift-end').value = '17:00';
    document.getElementById('shift-notes').value = '';
    document.getElementById('shift-alert').innerHTML = '';
    open_modal('shift-modal');
}

async function save_shift() {
    let employee_id = document.getElementById('shift-employee').value;
    let date = document.getElementById('shift-date').value;
    let start_time = document.getElementById('shift-start').value;
    let end_time = document.getElementById('shift-end').value;
    let notes = document.getElementById('shift-notes').value;

    if (!employee_id || !date || !start_time || !end_time) {
        return show_alert('shift-alert', 'Please fill in all required fields.', 'error');
    }

    let result = await api('POST', '/shifts', { employee_id, date, start_time, end_time, notes });
    if (result && result.id) {
        close_modal('shift-modal');
        load_schedule();
    } else {
        show_alert('shift-alert', result?.error || 'Failed to save shift.', 'error');
    }
}

async function delete_shift(id) {
    if (!confirm('Delete this shift?')) return;
    await api('DELETE', '/shifts/' + id);
    load_schedule();
}

// ── Add Employee ──
function open_add_employee() {
    document.getElementById('emp-name').value = '';
    document.getElementById('emp-email').value = '';
    document.getElementById('emp-role').value = '';
    document.getElementById('emp-alert').innerHTML = '';
    open_modal('employee-modal');
}

async function save_employee() {
    let name = document.getElementById('emp-name').value;
    let email = document.getElementById('emp-email').value;
    let role = document.getElementById('emp-role').value;

    if (!name) return show_alert('emp-alert', 'Employee name is required.', 'error');

    let result = await api('POST', '/employees', { name, email, role });
    if (result && result.id) {
        close_modal('employee-modal');
        load_employees();
    } else {
        show_alert('emp-alert', result?.error || 'Failed to add employee.', 'error');
    }
}

async function delete_employee(id) {
    if (!confirm('Delete this employee? Their shifts will remain.')) return;
    await api('DELETE', '/employees/' + id);
    load_employees();
}

// ── Init ──
if (!get_token()) {
    window.location.href = 'auth.html';
} else {
    document.getElementById('nav-business').innerText = localStorage.getItem('business_name');
    document.getElementById('nav-email').innerText = localStorage.getItem('email');
    load_employees();
    load_schedule();
}