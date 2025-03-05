// Workouts module for the fitness tracker app

// DOM Elements
const addWorkoutBtn = document.getElementById('add-workout-btn');
const workoutForm = document.getElementById('workout-form');
const dashboard = document.getElementById('dashboard');
const newWorkoutForm = document.getElementById('new-workout-form');
const cancelWorkoutBtn = document.getElementById('cancel-workout-btn');
const workoutsList = document.getElementById('workouts-list');
const totalWorkoutsEl = document.getElementById('total-workouts');
const weekWorkoutsEl = document.getElementById('week-workouts');
const workoutStreakEl = document.getElementById('workout-streak');

// Initialize workouts module
function initWorkouts() {
    // Event Listeners
    addWorkoutBtn.addEventListener('click', showWorkoutForm);
    cancelWorkoutBtn.addEventListener('click', hideWorkoutForm);
    newWorkoutForm.addEventListener('submit', saveWorkout);
    
    // Set today's date as default for new workouts
    document.getElementById('workout-date').valueAsDate = new Date();
}

// Show workout form
function showWorkoutForm() {
    dashboard.classList.add('hidden');
    workoutForm.classList.remove('hidden');
}

// Hide workout form
function hideWorkoutForm() {
    workoutForm.classList.add('hidden');
    dashboard.classList.remove('hidden');
    newWorkoutForm.reset();
    document.getElementById('workout-date').valueAsDate = new Date();
}

// Save workout
async function saveWorkout(e) {
    e.preventDefault();
    
    if (!dbService.currentUser) {
        showToast('You must be logged in to save workouts', 'error');
        return;
    }
    
    // Validate form data
    const duration = parseInt(document.getElementById('workout-duration').value);
    if (isNaN(duration) || duration <= 0) {
        showToast('Duration must be a positive number', 'error');
        return;
    }
    
    setLoading(true, addWorkoutBtn);
    
    const workoutData = {
        date: document.getElementById('workout-date').value,
        type: document.getElementById('workout-type').value,
        duration: duration,
        intensity: document.getElementById('workout-intensity').value,
        notes: document.getElementById('workout-notes').value
    };
    
    try {
        // Add workout using database service
        const result = await dbService.addWorkout(workoutData);
        
        if (result.offline) {
            showToast('Workout saved locally. Will sync when online.');
        } else {
            showToast('Workout saved successfully!');
        }
        
        // Reset form and show dashboard
        hideWorkoutForm();
        
        // Reload user data to show the new workout
        loadUserData();
    } catch (error) {
        console.error('Error saving workout:', error);
        showToast('Error saving workout. Please try again.', 'error');
    } finally {
        setLoading(false, addWorkoutBtn);
    }
}

// Load user data (workouts)
async function loadUserData() {
    if (!dbService.currentUser) return;
    
    try {
        // Get user's workouts
        const workouts = await dbService.getWorkouts();
        
        // Update dashboard stats
        updateStats(workouts);
        
        // Render workouts list
        renderWorkouts(workouts);
    } catch (error) {
        console.error('Error loading user data:', error);
        showToast('Error loading workouts', 'error');
    }
}

// Update dashboard stats
function updateStats(workouts) {
    // Total workouts
    totalWorkoutsEl.textContent = workouts.length;
    
    // Workouts this week
    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);
    
    const thisWeekWorkouts = workouts.filter(workout => {
        const workoutDate = new Date(workout.date);
        return workoutDate >= oneWeekAgo && workoutDate <= today;
    });
    
    weekWorkoutsEl.textContent = thisWeekWorkouts.length;
    
    // Workout streak
    const streak = calculateStreak(workouts);
    workoutStreakEl.textContent = `${streak} day${streak !== 1 ? 's' : ''}`;
}

// Calculate workout streak
function calculateStreak(workouts) {
    if (workouts.length === 0) return 0;
    
    // Sort workouts by date (newest first)
    const sortedWorkouts = [...workouts].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    // Get unique dates (in case of multiple workouts per day)
    const uniqueDates = [...new Set(sortedWorkouts.map(w => w.date))];
    
    // Check if the most recent workout was today or yesterday
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const mostRecentDate = new Date(uniqueDates[0]);
    mostRecentDate.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    // If most recent workout is not today or yesterday, streak is 0
    if (mostRecentDate < yesterday) return 0;
    
    // Count consecutive days
    let streak = 1;
    let currentDate = mostRecentDate;
    
    for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i]);
        prevDate.setHours(0, 0, 0, 0);
        
        const expectedDate = new Date(currentDate);
        expectedDate.setDate(currentDate.getDate() - 1);
        
        if (prevDate.getTime() === expectedDate.getTime()) {
            streak++;
            currentDate = prevDate;
        } else {
            break;
        }
    }
    
    return streak;
}

// Render workouts list
function renderWorkouts(workouts) {
    workoutsList.innerHTML = '';
    
    if (workouts.length === 0) {
        workoutsList.innerHTML = '<p class="no-workouts">No workouts yet. Add your first workout!</p>';
        return;
    }
    
    // Show only the 10 most recent workouts
    const recentWorkouts = workouts.slice(0, 10);
    
    recentWorkouts.forEach(workout => {
        const workoutEl = document.createElement('div');
        workoutEl.className = 'workout-item';
        
        // Format date
        const workoutDate = new Date(workout.date);
        const formattedDate = workoutDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        
        // Capitalize workout type
        const workoutType = workout.type.charAt(0).toUpperCase() + workout.type.slice(1);
        
        workoutEl.innerHTML = `
            <div class="workout-info">
                <h4>${workoutType} - ${workout.duration} min</h4>
                <div class="workout-meta">
                    ${formattedDate} • ${workout.intensity} intensity
                </div>
                ${workout.notes ? `<div class="workout-notes">${workout.notes}</div>` : ''}
            </div>
            <div class="workout-actions">
                <button class="delete-btn" data-id="${workout.id}">Delete</button>
            </div>
        `;
        
        workoutsList.appendChild(workoutEl);
        
        // Add delete event listener
        const deleteBtn = workoutEl.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteWorkout(workout.id));
    });
}

// Delete workout
async function deleteWorkout(workoutId) {
    if (!confirm('Are you sure you want to delete this workout?')) return;
    
    if (!dbService.currentUser) {
        showToast('You must be logged in to delete workouts', 'error');
        return;
    }
    
    setLoading(true, addWorkoutBtn);
    
    try {
        await dbService.deleteWorkout(workoutId);
        showToast('Workout deleted successfully');
        
        // Reload user data
        loadUserData();
    } catch (error) {
        console.error('Error deleting workout:', error);
        showToast('Error deleting workout. Please try again.', 'error');
    } finally {
        setLoading(false, addWorkoutBtn);
    }
}

// Export functions for use in other modules
window.initWorkouts = initWorkouts;
window.loadUserData = loadUserData;
