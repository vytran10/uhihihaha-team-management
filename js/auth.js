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
            
            const avatar = document.getElementById('user-avatar');
            const name = document.getElementById('user-name');
            const role = document.getElementById('user-role');
            
            if (avatar) avatar.src = user.photoURL || 'https://via.placeholder.com/40';
            if (name) name.textContent = user.displayName || 'Unknown';
            if (role) role.textContent = getRoleLabel(userData.role);
            
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
        console.log('Starting Google Sign-In...');
        console.log('Firebase auth:', auth);
        
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        
        console.log('Showing Google sign-in popup...');
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        console.log('User signed in:', user.email);
        
        // Check if user exists in database
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            console.log('Creating new user...');
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
            
            console.log('New user created with role:', role);
        } else {
            console.log('User already exists');
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
        
        console.log('Sign-in complete!');
        
    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        alert('Lỗi đăng nhập: ' + error.message);
    }
}

// Initialize on page load
window.addEventListener('load', async () => {
    console.log('Page loaded, checking auth...');
    
    await checkAuth();
    
    console.log('Setting up login button...');
    const googleLoginBtn = document.getElementById('google-login-btn');
    console.log('Login button element:', googleLoginBtn);
    
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', (e) => {
            console.log('Login button clicked!');
            e.preventDefault();
            handleGoogleSignIn();
        });
        console.log('Login button listener attached');
    } else {
        console.error('Login button not found!');
    }
});