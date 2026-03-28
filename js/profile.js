// Load profile page
async function loadProfilePage() {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists) return;
        
        const userData = userDoc.data();
        
        document.getElementById('profile-avatar').src = user.photoURL;
        document.getElementById('profile-name').textContent = user.displayName;
        document.getElementById('profile-email').textContent = user.email;
        document.getElementById('profile-role').textContent = getRoleLabel(userData.role);
        
        document.getElementById('profile-matches').textContent = userData.stats?.matchesPlayed || 0;
        document.getElementById('profile-points').textContent = userData.stats?.points || 0;
        
        const debt = await calculateUserDebt(user.uid);
        document.getElementById('profile-debt').textContent = formatCurrency(debt);
        
        await loadUnpaidMatches(user.uid);
        
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Load unpaid matches
async function loadUnpaidMatches(userId) {
    try {
        const paymentsSnapshot = await db.collection('payments')
            .where('userId', '==', userId)
            .where('status', '==', 'unpaid')
            .get();
        
        const container = document.getElementById('unpaid-matches');
        
        if (paymentsSnapshot.empty) {
            container.innerHTML = '<p style="text-align: center; padding: 20px; color: #2ECC71;">✅ Bạn không có trận nào chưa nộp tiền</p>';
            document.getElementById('profile-unpaid').textContent = '0';
            return;
        }
        
        let html = '<table><thead><tr><th>Trận</th><th>Ngày</th><th>Số tiền</th><th>Hành động</th></tr></thead><tbody>';
        
        paymentsSnapshot.forEach(doc => {
            const payment = doc.data();
            
            html += `
                <tr>
                    <td>${payment.matchName}</td>
                    <td>${formatDate(payment.date)}</td>
                    <td style="color: #E74C3C; font-weight: bold;">${formatCurrency(payment.amount)}</td>
                    <td>
                        <button class="btn btn-small btn-success" onclick="markAsPaid('${doc.id}', '${payment.matchName}', ${payment.amount})">✅ Đã nộp</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
        document.getElementById('profile-unpaid').textContent = paymentsSnapshot.size;
        
    } catch (error) {
        console.error('Error loading unpaid matches:', error);
    }
}

// Mark payment as paid
async function markAsPaid(paymentId, matchName, amount) {
    try {
        await db.collection('payments').doc(paymentId).update({
            status: 'paid',
            paidAt: new Date()
        });
        
        await db.collection('finance_transactions').add({
            type: 'income',
            amount: amount,
            description: `Thu từ ${auth.currentUser.displayName} - Trận ${matchName}`,
            date: new Date()
        });
        
        showAlert('Cập nhật nộp tiền thành công!', 'success');
        await loadProfilePage();
        
    } catch (error) {
        console.error('Error marking payment:', error);
        alert('Lỗi: ' + error.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const profileNav = document.querySelector('[data-page="profile"]');
    if (profileNav) {
        profileNav.addEventListener('click', () => {
            loadProfilePage();
        });
    }
});