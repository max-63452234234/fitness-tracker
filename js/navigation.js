// Navigation module for the fitness tracker app

// DOM Elements
const navLinks = document.querySelectorAll('.nav-link');
const bottomNavLinks = document.querySelectorAll('.bottom-nav-link');
const appSections = document.querySelectorAll('.app-section');

// App State
let activeSection = 'dashboard';

// Initialize navigation module
function initNavigation() {
    // Event Listeners - Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });

    // Event Listeners - Bottom Navigation (Mobile)
    if (bottomNavLinks) {
        bottomNavLinks.forEach(link => {
            link.addEventListener('click', handleNavigation);
        });
    }
}

// Handle navigation between sections
function handleNavigation(e) {
    e.preventDefault();
    
    // Get the target section
    const targetSection = e.target.getAttribute('data-section');
    
    // If clicking on a bottom nav link, find the actual link
    if (!targetSection && e.target.parentElement && e.target.parentElement.getAttribute('data-section')) {
        return handleNavigation({ 
            preventDefault: () => {}, 
            target: e.target.parentElement 
        });
    }
    
    if (!targetSection) return;
    
    // Update active section
    activeSection = targetSection;
    
    // Update active nav link
    navLinks.forEach(link => {
        if (link.getAttribute('data-section') === targetSection) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Update active bottom nav link
    if (bottomNavLinks) {
        bottomNavLinks.forEach(link => {
            if (link.getAttribute('data-section') === targetSection) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
    
    // Show the target section, hide others
    appSections.forEach(section => {
        if (section.id === targetSection) {
            section.classList.remove('hidden');
        } else {
            section.classList.add('hidden');
        }
    });
    
    // Hide all form sections
    document.querySelectorAll('.form-section').forEach(form => {
        form.classList.add('hidden');
    });
    
    // Load section data if needed
    loadSectionContent(targetSection);
}

// Load section content based on the active section
function loadSectionContent(section) {
    if (section === 'dashboard' && typeof loadUserData === 'function') {
        loadUserData();
    } else if (section === 'goals' && typeof loadGoals === 'function') {
        loadGoals();
    } else if (section === 'measurements' && typeof loadMeasurements === 'function') {
        loadMeasurements();
    } else if (section === 'habits' && typeof loadHabits === 'function') {
        loadHabits();
    }
}

// Get the current active section
function getActiveSection() {
    return activeSection;
}

// Export functions for use in other modules
window.initNavigation = initNavigation;
window.handleNavigation = handleNavigation;
window.getActiveSection = getActiveSection;
window.loadSectionContent = loadSectionContent;
