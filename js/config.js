// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyB7q5q9PRzhfRTJO4w2bjOM8p9FGJrdlN4",
  authDomain: "uhihihaha-4dbdf.firebaseapp.com",
  projectId: "uhihihaha-4dbdf",
  storageBucket: "uhihihaha-4dbdf.firebasestorage.app",
  messagingSenderId: "255192820788",
  appId: "1:255192820788:web:408e81240f26e351b3ae61",
  measurementId: "G-7HMNNQ2QGW"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// Admin Email
const ADMIN_EMAIL = "vytrantan1010@gmail.com";

// Default costs
const DEFAULT_COSTS = {
  win: 30000,
  loss: 40000,
  draw: 35000
};

// Roles
const ROLES = {
  admin: 'admin',
  host: 'host',
  player: 'player'
};