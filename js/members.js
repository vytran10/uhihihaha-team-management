// Load members page
async function loadMembersPage() {
    const user = auth.currentUser;
    if (!user) return;
    
    const userData = await getCurrentUserData();
    
    await loadAllMembers();
}

// Load all members
async function loadAllMembers() {
    try {
        const membersSnapshot = await db.collection('users')
            .orderBy('createdAt', 'desc')
            .get();
        
        const container = document.getElementById('members-container');
        container.innerHTML = '';
        
        if (membersSnapshot.empty) {
            container.innerHTML = '<p style="text-align: center; padding: 40px;">Chưa có thành viên nào</p>';
            return;
        }
        
        membersSnapshot.forEach(doc => {
            const member = doc.data();
            const memberCard = createMemberCard(doc.id, member);
            container.appendChild(memberCard);
        });
        
    } catch (error) {
        console.error('Error loading members:', error);
    }
}

// Create member card
function createMemberCard(memberId, memberData) {
    const div = document.createElement('div');
    div.className = 'member-card';
    
    div.innerHTML = `
        <img src="${memberData.photoURL}" alt="Avatar" class="member-avatar">
        <div class="member-name">${memberData.name}</div>
        <div class="member-role">${getRoleLabel(memberData.role)}</div>
        <div class="member-stats">
            <div class="member-stat">
                <div class="member-stat-value">${memberData.stats?.matchesPlayed || 0}</div>
                <div class="member-stat-label">Trận đã đá</div>
            </div>
            <div class="member-stat">
                <div class="member-stat-value">${formatCurrency(memberData.stats?.debt || 0)}</div>
                <div class="member-stat-label">Nợ</div>
            </div>
        </div>
    `;
    
    div.addEventListener('click', () => {
        showMemberProfile(memberId, memberData);
    });
    
    return div;
}

// Show member profile
async function showMemberProfile(memberId, memberData) {
    if (auth.currentUser.uid === memberId) {
        showPage('profile');
        await loadProfilePage();
    } else {
        alert('Xem hồ sơ: ' + memberData.name);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const membersNav = document.querySelector('[data-page="members"]');
    if (membersNav) {
        membersNav.addEventListener('click', () => {
            loadMembersPage();
        });
    }
});