const API = 'http://localhost:3000/api';
const token = localStorage.getItem('token');
const username = localStorage.getItem('username');

if (!token) window.location.href = '/';

document.getElementById('welcomeMsg').textContent = `Hi, ${username}`;

document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/';
});

const categories = {
    income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
    expense: ['Housing', 'Food', 'Transport', 'Utilities', 'Health', 'Entertainment', 'Shopping', 'Other']
};

const txType = document.getElementById('txType');
const txCategory = document.getElementById('txCategory');
const txDate = document.getElementById('txDate');

function populateCategories() {
    txCategory.innerHTML = '';
    categories[txType.value].forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        txCategory.appendChild(opt);
    });
}

txType.addEventListener('change', populateCategories);
populateCategories();

txDate.value = new Date().toISOString().split('T')[0];

let transactions = [];
let chart = null;

async function fetchTransactions() {
    try {
        const res = await fetch(`${API}/transactions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/';
        }
        transactions = await res.json();
        populateMonthFilter();
        render();
    } catch (err) {
        console.error('Failed to fetch transactions', err);
    }
}

function populateMonthFilter() {
    const filter = document.getElementById('monthFilter');
    const current = filter.value;
    const months = new Set();

    transactions.forEach(tx => {
        const m = tx.date.slice(0, 7);
        months.add(m);
    });

    filter.innerHTML = '<option value="all">All time</option>';
    [...months].sort().reverse().forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        const [y, mo] = m.split('-');
        opt.textContent = new Date(y, mo - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
        filter.appendChild(opt);
    });

    filter.value = current;
}

function getFiltered() {
    const month = document.getElementById('monthFilter').value;
    if (month === 'all') return transactions;
    return transactions.filter(tx => tx.date.startsWith(month));
}

function render() {
    const filtered = getFiltered();

    const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = income - expenses;

    document.getElementById('totalIncome').textContent = `$${income.toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = `$${expenses.toFixed(2)}`;
    document.getElementById('totalBalance').textContent = `$${balance.toFixed(2)}`;

    document.getElementById('totalBalance').style.color =
        balance >= 0 ? '#00ff88' : '#ff4444';

    renderChart(filtered);
    renderList(filtered);
}

function renderChart(filtered) {
    const expenses = filtered.filter(t => t.type === 'expense');
    const byCategory = {};
    expenses.forEach(t => {
        byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    });

    const labels = Object.keys(byCategory);
    const data = Object.values(byCategory);
    const colors = ['#00ff88', '#00aaff', '#ff4444', '#ffaa00', '#aa44ff', '#ff44aa', '#44ffaa', '#ffff44'];

    if (chart) chart.destroy();

    if (labels.length === 0) {
        document.getElementById('spendingChart').style.display = 'none';
        return;
    }

    document.getElementById('spendingChart').style.display = 'block';

    chart = new Chart(document.getElementById('spendingChart'), {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#888', font: { size: 12 }, padding: 16 }
                }
            }
        }
    });
}

function renderList(filtered) {
    const list = document.getElementById('txList');

    if (filtered.length === 0) {
        list.innerHTML = '<p class="tx-empty">No transactions yet. Add one above.</p>';
        return;
    }

    list.innerHTML = filtered.map(tx => `
    <div class="tx-item">
      <div class="tx-left">
        <span class="tx-desc">${tx.description || tx.category}</span>
        <span class="tx-meta">${tx.category} · ${tx.date}</span>
      </div>
      <div class="tx-right">
        <span class="tx-amount ${tx.type}">
          ${tx.type === 'income' ? '+' : '-'}$${tx.amount.toFixed(2)}
        </span>
        <button class="btn-delete" data-id="${tx.id}">✕</button>
      </div>
    </div>
  `).join('');

    list.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => deleteTransaction(btn.dataset.id));
    });
}

async function deleteTransaction(id) {
    try {
        await fetch(`${API}/transactions/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        transactions = transactions.filter(t => t.id != id);
        render();
    } catch (err) {
        console.error('Failed to delete', err);
    }
}

document.getElementById('btnAddTx').addEventListener('click', async () => {
    const type = txType.value;
    const category = txCategory.value;
    const amount = document.getElementById('txAmount').value;
    const description = document.getElementById('txDescription').value.trim();
    const date = txDate.value;
    const error = document.getElementById('txError');

    if (!amount || !date) {
        return error.textContent = 'Amount and date are required';
    }

    error.textContent = '';

    try {
        const res = await fetch(`${API}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ type, category, amount, description, date })
        });
        const data = await res.json();
        if (!res.ok) return error.textContent = data.error;
        transactions.unshift(data);
        document.getElementById('txAmount').value = '';
        document.getElementById('txDescription').value = '';
        populateMonthFilter();
        render();
    } catch (err) {
        error.textContent = 'Could not connect to server';
    }
});

document.getElementById('monthFilter').addEventListener('change', render);

fetchTransactions();