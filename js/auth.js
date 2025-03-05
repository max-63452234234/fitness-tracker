// DOM Elements
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const authModal = document.getElementById('auth-modal');
const modalTitle = document.getElementById('modal-title');
const authForm = document.getElementById('auth-form');
const closeBtn = document.querySelector('.close');
const userEmail = document.getElementById('user-email');
const loggedOutSection = document.getElementById('logged-out');
const loggedInSection = document.getElementById('logged-in');
const appContent = document.getElementById('app-content');

// Authentication state
let isLogin = true;

// Event Listeners
loginBtn.addEventListener('click', () => openAuthModal('Login'));
signupBtn.addEventListener('click', () => openAuthModal('Sign Up'));
logoutBtn.addEventListener('click', logout);
closeBtn.addEventListener('click', closeAuthModal);
authForm.addEventListener('submit', handleAuth);

// Check auth state on page load
document.addEventListener('DOMContentLoaded', () => {
    const user = dbService.checkAuthState();
    updateUIForAuthState(user);
});

// Update UI based on authentication state
function updateUIForAuthState(user) {
    if (user) {
        // User is signed in
        userEmail.textContent = user.email;
        loggedOutSection.classList.add('hidden');
        loggedInSection.classList.remove('hidden');
        appContent.classList.remove('hidden');
        
        // Load user data
        loadUserData();
    } else {
        // User is signed out
        loggedOutSection.classList.remove('hidden');
        loggedInSection.classList.add('hidden');
        appContent.classList.add('hidden');
    }
}

// Open auth modal
function openAuthModal(mode) {
    modalTitle.textContent = mode;
    isLogin = mode === 'Login';
    authModal.classList.remove('hidden');
}

// Close auth modal
function closeAuthModal() {
    authModal.classList.add('hidden');
    authForm.reset();
}

// Handle authentication
async function handleAuth(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        let result;
        
        if (isLogin) {
            // Login
            result = await dbService.loginUser(email, password);
        } else {
            // Sign up
            result = await dbService.registerUser(email, password);
        }
        
        if (result.success) {
            // Update UI
            updateUIForAuthState(result.user);
            
            // Close modal on success
            closeAuthModal();
        }
    } catch (error) {
        alert(`Authentication error: ${error.message}`);
    }
}

// Logout
function logout() {
    dbService.logoutUser()
        .then(() => {
            updateUIForAuthState(null);
        })
        .catch(error => {
            console.error('Error signing out:', error);
        });
}

// Load user data
function loadUserData() {
    // Load workouts
    dbService.getWorkouts()
        .then(workouts => {
            // Update dashboard stats
            updateStats(workouts);
            
            // Render workouts list
            renderWorkouts(workouts);
        })
        .catch(error => {
            console.error('Error loading workouts:', error);
            showToast('Error loading workouts', 'error');
        });
    
    // Load goals if on goals section
    if (activeSection === 'goals') {
        loadGoals();
    }
    
    // Load measurements if on measurements section
    if (activeSection === 'measurements') {
        loadMeasurements();
    }
}
