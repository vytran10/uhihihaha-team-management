// Firebase Google Authentication Functions

// This function handles the credential response after Google Sign-In
function handleCredentialResponse(response) {
    const credential = response.credential;
    // Perform sign-in with the credential obtained
    firebase.auth().signInWithCredential(firebase.auth.GoogleAuthProvider.credential(credential))
        .then((userCredential) => {
            // User signed in successfully
            console.log('User signed in:', userCredential.user);
            loadUserData(userCredential.user);
        })
        .catch((error) => {
            console.error('Error during sign-in:', error);
        });
}

// This function checks the authentication state and persists session info in localStorage
function checkAuth() {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            console.log('User is signed in:', user);
            // Persist user session
            localStorage.setItem('user', JSON.stringify(user));
            loadUserData(user);
        } else {
            console.log('No user is signed in');
            localStorage.removeItem('user');
        }
    });
}

// This function loads user data and updates the UI based on user role
function loadUserData(user) {
    const userRole = user.email === 'admin@example.com' ? 'admin' : 'user'; // Simplified role check
    // Update UI based on user role
    if (userRole === 'admin') {
        // Show admin menu
        document.getElementById('adminMenu').style.display = 'block';
    } else {
        // Show user menu
        document.getElementById('userMenu').style.display = 'block';
    }
}

// Example of adding event listener for Google Sign-In
document.getElementById('googleSignInBtn').addEventListener('click', () => {
    // Initiate Google Sign-In
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider);
});