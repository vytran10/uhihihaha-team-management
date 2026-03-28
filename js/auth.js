// Check if user is logged in
async function checkAuth() {
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
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
                } catch (e) {
                    console.error('Error checking user:', e);
                }
            } else {
                document.getElementById('auth-screen').style.display = 'flex';
                document.getElementById('app-screen').style.display = 'none';
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
    
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            
            document.getElementById('user-avatar').src = user.photoURL || 'https://via.placeholder.com/40';
            document.getElementById('user-name').textContent = user.displayName || 'Unknown';
            document.getElementById('user-role').textContent = getRoleLabel(userData.role);
            
            const financeMenu = document.getElementById('finance-menu');
            const adminMenu = document.getElementById('admin-menu');
            
            if (userData.role === ROLES.host || userData.role === ROLES.admin) {
                if (financeMenu) financeMenu.style.display = 'flex';
            }
            
            if (userData.role === ROLES.admin) {
                if (adminMenu) adminMenu.style.display = 'flex';
            }
        }
    } catch (e) {
        console.error('Error loading user data:', e);
    }
}

// Handle Google Sign-In
async function handleGoogleSignIn() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        // Check if user exists in database
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            // Create new user
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
        console.error('Lỗi đăng nhập:', error);
        showAlert('Lỗi đăng nhập: ' + error.message, 'error');
    }
}

// Initialize on page load
window.addEventListener('load', async () => {
    await checkAuth();
    
    const googleLoginBtn = document.getElementById('google-login-btn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', handleGoogleSignIn);
    }
});