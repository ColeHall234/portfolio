const API = 'http://localhost:3000/api';

function show_tab(tab) {
    document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
    document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
    document.querySelectorAll('.auth-tab').forEach(function (t, i) {
        t.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register'));
    });
    clear_alert();
}

function show_alert(message, type) {
    let box = document.getElementById('alert-box');
    box.innerHTML = '<div class="alert alert-' + type + '">' + message + '</div>';
}

function clear_alert() {
    document.getElementById('alert-box').innerHTML = '';
}

async function login() {
    let email = document.getElementById('login-email').value;
    let password = document.getElementById('login-password').value;
    if (!email || !password) return show_alert('Please fill in all fields.', 'error');
    try {
        let res = await fetch(API + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        let data = await res.json();
        if (!res.ok) return show_alert(data.error, 'error');
        localStorage.setItem('token', data.token);
        localStorage.setItem('business_name', data.business_name);
        localStorage.setItem('email', data.email);
        window.location.href = 'app.html';
    } catch (err) {
        show_alert('Could not connect to server.', 'error');
    }
}

async function register() {
    let business_name = document.getElementById('reg-business').value;
    let email = document.getElementById('reg-email').value;
    let password = document.getElementById('reg-password').value;
    if (!business_name || !email || !password) return show_alert('Please fill in all fields.', 'error');
    try {
        let res = await fetch(API + '/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ business_name, email, password })
        });
        let data = await res.json();
        if (!res.ok) return show_alert(data.error, 'error');
        localStorage.setItem('token', data.token);
        localStorage.setItem('business_name', data.business_name);
        localStorage.setItem('email', data.email);
        window.location.href = 'app.html';
    } catch (err) {
        show_alert('Could not connect to server.', 'error');
    }
}

if (localStorage.getItem('token')) {
    window.location.href = 'app.html';
}