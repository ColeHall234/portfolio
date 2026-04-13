const API = 'http://localhost:3000/api';

document.getElementById('tabLogin').addEventListener('click', () => {
    document.getElementById('tabLogin').classList.add('active');
    document.getElementById('tabRegister').classList.remove('active');
    document.getElementById('formLogin').style.display = 'block';
    document.getElementById('formRegister').style.display = 'none';
    document.getElementById('authError').textContent = '';
});

document.getElementById('tabRegister').addEventListener('click', () => {
    document.getElementById('tabRegister').classList.add('active');
    document.getElementById('tabLogin').classList.remove('active');
    document.getElementById('formRegister').style.display = 'block';
    document.getElementById('formLogin').style.display = 'none';
    document.getElementById('authError').textContent = '';
});

document.getElementById('btnLogin').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const error = document.getElementById('authError');

    try {
        const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) return error.textContent = data.error;
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        window.location.href = '/app';
    } catch (err) {
        error.textContent = 'Could not connect to server';
    }
});

document.getElementById('btnRegister').addEventListener('click', async (e) => {
    e.preventDefault();
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const error = document.getElementById('authError');

    try {
        const res = await fetch(`${API}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();
        if (!res.ok) return error.textContent = data.error;
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        window.location.href = '/app';
    } catch (err) {
        error.textContent = 'Could not connect to server';
    }
});

if (localStorage.getItem('token')) {
    window.location.href = '/app';
}