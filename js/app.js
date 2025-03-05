// Main application entry point
document.addEventListener('DOMContentLoaded', () => {
    // Initialize modules
    if (typeof initNavigation === 'function') {
        initNavigation();
    }
    
    if (typeof initWorkouts === 'function') {
        initWorkouts();
    }
    
    if (typeof initGoals === 'function') {
        initGoals();
    }
    
    if (typeof initMeasurements === 'function') {
        initMeasurements();
    }
    
    if (typeof initHabitTracker === 'function') {
        initHabitTracker();
    }
    
    // Set up online/offline event listeners
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    // Check initial online status
    if (typeof handleOnlineStatus === 'function') {
        handleOnlineStatus();
    }

    // Check authentication state
    const user = dbService.checkAuthState();
    if (user) {
        showLoggedInState(user);
        
        // Load content for the active section
        const activeSection = typeof getActiveSection === 'function' ? getActiveSection() : 'dashboard';
        if (typeof loadSectionContent === 'function') {
            loadSectionContent(activeSection);
        }
    } else {
        showLoggedOutState();
    }
});

// Show logged in state
function showLoggedInState(user) {
    document.getElementById('logged-out').classList.add('hidden');
    document.getElementById('logged-in').classList.remove('hidden');
    document.getElementById('user-email').textContent = user.email;
    document.getElementById('app-content').classList.remove('hidden');
}

// Show logged out state
function showLoggedOutState() {
    document.getElementById('logged-in').classList.add('hidden');
    document.getElementById('logged-out').classList.remove('hidden');
    document.getElementById('app-content').classList.add('hidden');
}
