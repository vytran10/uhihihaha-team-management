function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDate(date) {
    if (typeof date === 'object' && date.toDate) date = date.toDate();
    return new Intl.DateTimeFormat('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date);
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('open');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('open');
}

function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `<span>${message}</span>`;
    const contentArea = document.querySelector('.content-area');
    if (contentArea) contentArea.insertBefore(alertDiv, contentArea.firstChild);
    setTimeout(() => { alertDiv.remove(); }, 3000);
}

async function getCurrentUserRole() {
    const user = auth.currentUser;
    if (!user) return null;
    const userDoc = await db.collection('users').doc(user.uid).get();
    return userDoc.exists ? userDoc.data().role : null;
}

async function isAdmin() {
    const role = await getCurrentUserRole();
    return role === ROLES.admin;
}

async function isHostOrAdmin() {
    const role = await getCurrentUserRole();
    return role === ROLES.admin || role === ROLES.host;
}

async function getCurrentUserData() {
    const user = auth.currentUser;
    if (!user) return null;
    const userDoc = await db.collection('users').doc(user.uid).get();
    return userDoc.data();
}

function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => page.style.display = 'none');
    const pageElement = document.getElementById(pageName + '-page');
    if (pageElement) pageElement.style.display = 'block';
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const activeNav = document.querySelector(`[data-page="${pageName}"]`);
    if (activeNav) activeNav.classList.add('active');
}

async function calculateUserDebt(userId) {
    const paymentsSnapshot = await db.collection('payments')
        .where('userId', '==', userId).where('status', '==', 'unpaid').get();
    let totalDebt = 0;
    paymentsSnapshot.forEach(doc => { totalDebt += doc.data().amount || 0; });
    return totalDebt;
}

async function calculateTotalFund() {
    const transactionsSnapshot = await db.collection('finance_transactions').get();
    let balance = 0;
    transactionsSnapshot.forEach(doc => {
        const transaction = doc.data();
        if (transaction.type === 'income') balance += transaction.amount || 0;
        else balance -= transaction.amount || 0;
    });
    return balance;
}

function getRoleLabel(role) {
    const labels = { admin: 'Quản trị viên', host: 'Chủ trận', player: 'Cầu thủ' };
    return labels[role] || 'Người dùng';
}
