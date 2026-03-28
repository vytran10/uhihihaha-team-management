// Check if user is logged in
async function checkAuth() {
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    localStorage.setItem('currentUser', JSON.stringify({
                        uid: user.uid,
                        email: user.email,
                        name: user.displayName,
                        photoURL: user.photoURL,
                        ...userDoc.data()
                    }));
                    
                    document.getElementById('auth-screen').style.display = 'none';
                    document.getElementById('app-screen').style.display = 'flex';
                    
                    await loadUserData();
                    initializeApp();
                }
            } else {
                const savedUser = localStorage.getItem('currentUser');
                if (savedUser) {
                    try {
                        document.getElementById('auth-screen').style.display = 'none';
                        document.getElementById('app-screen').style.display = 'flex';
                    } catch (e) {
                        document.getElementById('auth-screen').style.display = 'flex';
                        document.getElementById('app-screen').style.display = 'none';
                    }
                } else {
                    document.getElementById('auth-screen').style.display = 'flex';
                    document.getElementById('app-screen').style.display = 'none';
                }
            }
            resolve();
            unsubscribe();
        });
    });
}

// Load user data
async function loadUserData() {
    const user = auth.currentUser;
    if (!user) return;
    
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.exists) {
        const userData = userDoc.data();
        
        document.getElementById('user-avatar').src = user.photoURL || 'https://via.placeholder.com/40';
        document.getElementById('user-name').textContent = user.displayName || 'Unknown';
        document.getElementById('user-role').textContent = getRoleLabel(userData.role);
        
        const financeMenu = document.getElementById('finance-menu');
        const adminMenu = document.getElementById('admin-menu');
        
        if (userData.role === ROLES.host || userData.role === ROLES.admin) {
            financeMenu.style.display = 'flex';
        }
        
        if (userData.role === ROLES.admin) {
            adminMenu.style.display = 'flex';
        }
    }
}

// Handle Google Sign-In with Firebase
async function handleGoogleSignIn() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        
        const user = result.user;
        
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            let role = ROLES.player;
            
            if (user.email === ADMIN_EMAIL) {
                role = ROLES.admin;
            }
            
            await db.collection('users').doc(user.uid).set({
                uid: user.uid,
                email: user.email,
                name: user.displayName,
                photoURL: user.photoURL,
                role: role,
                createdAt: new Date(),
                stats: {
                    matchesPlayed: 0,
                    points: 0,
                    debt: 0
                }
            });
        }
        
        localStorage.setItem('currentUser', JSON.stringify({
            uid: user.uid,
            email: user.email,
            name: user.displayName,
            photoURL: user.photoURL
        }));
        
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('app-screen').style.display = 'flex';
        
        await loadUserData();
        initializeApp();
        
    } catch (error) {
        console.error('Error signing in:', error);
        alert('Lỗi đăng nhập: ' + error.message);
    }
}

// Initialize on page load
window.addEventListener('load', () => {
    checkAuth();
    
    const googleLoginBtn = document.getElementById('google-login-btn');
    if (googleLoginBtn) {
        const button = document.createElement('button');
        button.className = 'btn btn-primary btn-large';
        button.innerHTML = '🔗 Đăng nhập bằng Google';
        button.onclick = handleGoogleSignIn;
        googleLoginBtn.appendChild(button);
    }
});