// Load matches page
async function loadMatchesPage() {
    const user = auth.currentUser;
    if (!user) return;
    
    const userData = await getCurrentUserData();
    
    const createBtn = document.getElementById('create-match-btn');
    if (userData.role === ROLES.host || userData.role === ROLES.admin) {
        createBtn.style.display = 'block';
        createBtn.addEventListener('click', showCreateMatchModal);
    }
    
    await loadAllMatches();
}

// Show create match modal
function showCreateMatchModal() {
    document.getElementById('match-modal-title').textContent = 'Tạo trận đấu mới';
    document.getElementById('match-name').value = '';
    document.getElementById('match-date').value = '';
    document.getElementById('match-location').value = '';
    document.getElementById('match-cost').value = '';
    
    document.getElementById('save-match-btn').onclick = saveNewMatch;
    openModal('match-modal');
}

// Save new match
async function saveNewMatch() {
    const name = document.getElementById('match-name').value;
    const date = document.getElementById('match-date').value;
    const location = document.getElementById('match-location').value;
    const cost = parseInt(document.getElementById('match-cost').value);
    
    if (!name || !date || !location || !cost) {
        alert('Vui lòng điền đầy đủ thông tin');
        return;
    }
    
    try {
        const matchRef = await db.collection('matches').add({
            name: name,
            date: new Date(date),
            location: location,
            cost: cost,
            status: 'pending',
            createdBy: auth.currentUser.uid,
            createdAt: new Date(),
            votes: {},
            teamRed: [],
            teamBlack: [],
            result: null
        });
        
        showAlert('Tạo trận đấu thành công!', 'success');
        closeModal('match-modal');
        await loadAllMatches();
        showShareModal(matchRef.id);
        
    } catch (error) {
        console.error('Error creating match:', error);
        alert('Lỗi tạo trận đấu: ' + error.message);
    }
}

// Show share modal
function showShareModal(matchId) {
    const shareLink = `${window.location.origin}?match=${matchId}`;
    document.getElementById('share-link').value = shareLink;
    openModal('share-modal');
}

// Load all matches
async function loadAllMatches() {
    try {
        const matchesSnapshot = await db.collection('matches')
            .orderBy('date', 'desc')
            .get();
        
        const container = document.getElementById('matches-container');
        container.innerHTML = '';
        
        if (matchesSnapshot.empty) {
            container.innerHTML = '<p style="text-align: center; padding: 40px; color: #999;">Chưa có trận đấu nào</p>';
            return;
        }
        
        const user = auth.currentUser;
        const userData = await getCurrentUserData();
        
        matchesSnapshot.forEach(doc => {
            const match = doc.data();
            const matchCard = document.createElement('div');
            matchCard.className = 'card';
            matchCard.style.marginBottom = '20px';
            
            const statusLabels = {
                pending: 'Chờ xử lý',
                voting: 'Bình chọn',
                locked: 'Khóa',
                finished: 'Kết thúc'
            };
            
            const userVote = match.votes[user.uid] || null;
            let voteText = 'Chưa bình chọn';
            if (userVote === 'yes') voteText = '✅ Sẽ đi';
            if (userVote === 'no') voteText = '❌ Không đi';
            
            matchCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                    <div>
                        <h3 style="margin-bottom: 5px;">${match.name}</h3>
                        <div style="color: #666; font-size: 0.95em;">
                            <div>📅 ${formatDate(match.date)}</div>
                            <div>📍 ${match.location}</div>
                            <div>💰 ${formatCurrency(match.cost)}</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <span class="match-status ${match.status === 'voting' ? 'status-voting' : 'status-' + match.status}">${statusLabels[match.status]}</span>
                        ${match.status === 'voting' ? `<div style="margin-top: 10px; color: #666; font-size: 0.9em;">${voteText}</div>` : ''}
                    </div>
                </div>
            `;
            
            const buttonContainer = document.createElement('div');
            buttonContainer.style.display = 'flex';
            buttonContainer.style.gap = '10px';
            buttonContainer.style.marginTop = '15px';
            buttonContainer.style.borderTop = '1px solid #ddd';
            buttonContainer.style.paddingTop = '15px';
            
            const viewBtn = document.createElement('button');
            viewBtn.className = 'btn btn-primary';
            viewBtn.textContent = '👁️ Xem chi tiết';
            viewBtn.onclick = () => showMatchDetails(doc.id, match);
            buttonContainer.appendChild(viewBtn);
            
            if (userData.role === ROLES.host || userData.role === ROLES.admin) {
                if (match.status === 'pending') {
                    const startBtn = document.createElement('button');
                    startBtn.className = 'btn btn-success';
                    startBtn.textContent = '🎯 Bắt đầu bình chọn';
                    startBtn.onclick = () => startVoting(doc.id);
                    buttonContainer.appendChild(startBtn);
                }
                
                if (match.status === 'voting') {
                    const lockBtn = document.createElement('button');
                    lockBtn.className = 'btn btn-warning';
                    lockBtn.textContent = '🔒 Khóa bình chọn';
                    lockBtn.onclick = () => lockVoting(doc.id);
                    buttonContainer.appendChild(lockBtn);
                }
            }
            
            matchCard.appendChild(buttonContainer);
            container.appendChild(matchCard);
        });
        
    } catch (error) {
        console.error('Error loading matches:', error);
    }
}

// Start voting
async function startVoting(matchId) {
    try {
        await db.collection('matches').doc(matchId).update({
            status: 'voting'
        });
        
        showAlert('Bắt đầu bình chọn thành công!', 'success');
        await loadAllMatches();
        
    } catch (error) {
        console.error('Error starting voting:', error);
        alert('Lỗi: ' + error.message);
    }
}

// Lock voting
async function lockVoting(matchId) {
    try {
        await db.collection('matches').doc(matchId).update({
            status: 'locked'
        });
        
        showAlert('Khóa bình chọn thành công!', 'success');
        await loadAllMatches();
        
    } catch (error) {
        console.error('Error locking voting:', error);
        alert('Lỗi: ' + error.message);
    }
}

// Vote
async function vote(matchId, vote) {
    try {
        const user = auth.currentUser;
        await db.collection('matches').doc(matchId).update({
            [`votes.${user.uid}`]: vote
        });
        
        showAlert(vote === 'yes' ? 'Bạn đã chọn sẽ đi' : 'Bạn đã chọn không đi', 'success');
        
    } catch (error) {
        console.error('Error voting:', error);
        alert('Lỗi bình chọn: ' + error.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const matchesNav = document.querySelector('[data-page="matches"]');
    if (matchesNav) {
        matchesNav.addEventListener('click', () => {
            loadMatchesPage();
        });
    }
});
