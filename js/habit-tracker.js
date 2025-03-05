// Habit Tracker Module

// DOM Elements
const addHabitBtn = document.getElementById('add-habit-btn');
const habitForm = document.getElementById('habit-form');
const newHabitForm = document.getElementById('new-habit-form');
const cancelHabitBtn = document.getElementById('cancel-habit-btn');
const habitsList = document.getElementById('habits-list');
const habitGridContent = document.getElementById('habit-grid-content');
const habitsSection = document.getElementById('habits');
const customDaysGroup = document.getElementById('custom-days-group');
const habitFrequencySelect = document.getElementById('habit-frequency');

// State
let habits = [];
let habitLogs = {};
let currentWeekStart = null;
let currentView = 'week'; // 'week', 'month', 'year'

// Initialize habit tracker
function initHabitTracker() {
    // Set up event listeners
    addHabitBtn.addEventListener('click', showHabitForm);
    cancelHabitBtn.addEventListener('click', hideHabitForm);
    newHabitForm.addEventListener('submit', saveHabit);
    
    // Set up frequency select change handler
    habitFrequencySelect.addEventListener('change', handleFrequencyChange);
    
    // Set up matrix tabs
    const matrixTabs = document.querySelectorAll('.habit-matrix-tab');
    matrixTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            matrixTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update view
            currentView = tab.textContent.toLowerCase();
            renderHabitGrid();
        });
    });
    
    // Set current week start to Monday of current week
    setCurrentWeekStart();
}

// Set current week start to Monday of current week
function setCurrentWeekStart() {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    
    currentWeekStart = new Date(today.setDate(diff));
    currentWeekStart.setHours(0, 0, 0, 0);
}

// Format date as YYYY-MM-DD
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// Get date range for current view
function getDateRange() {
    const startDate = new Date(currentWeekStart);
    let endDate;
    
    if (currentView === 'week') {
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
    } else if (currentView === 'month') {
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 29); // Show 30 days
    } else if (currentView === 'year') {
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 364); // Show 365 days
    }
    
    return {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate)
    };
}

// Load habits
async function loadHabits() {
    try {
        // Get habits from database
        habits = await dbService.getHabits();
        
        // Get date range for current view
        const { startDate, endDate } = getDateRange();
        
        // Get habit logs for each habit
        habitLogs = {};
        
        for (const habit of habits) {
            const logs = await dbService.getHabitLogs(habit.id, startDate, endDate);
            habitLogs[habit.id] = logs;
        }
        
        // Render habits
        renderHabits();
        renderHabitGrid();
    } catch (error) {
        console.error('Error loading habits:', error);
        showToast('Error loading habits', 'error');
    }
}

// Render habits list
function renderHabits() {
    habitsList.innerHTML = '';
    
    if (habits.length === 0) {
        habitsList.innerHTML = '<p class="no-habits">No habits yet. Add your first habit!</p>';
        return;
    }
    
    habits.forEach(habit => {
        const habitEl = document.createElement('div');
        habitEl.className = 'habit-item';
        
        // Calculate stats
        const stats = calculateHabitStats(habit);
        
        // Format frequency
        let frequencyText = '';
        switch (habit.frequency) {
            case 'daily':
                frequencyText = 'Every day';
                break;
            case 'weekdays':
                frequencyText = 'Weekdays';
                break;
            case 'weekends':
                frequencyText = 'Weekends';
                break;
            case 'weekly':
                frequencyText = 'Once a week';
                break;
            case 'custom':
                frequencyText = 'Custom schedule';
                break;
            default:
                frequencyText = habit.frequency;
        }
        
        habitEl.innerHTML = `
            <div class="habit-item-header">
                <h4 class="habit-item-name">${habit.name}</h4>
                <span class="habit-item-frequency">${frequencyText}</span>
            </div>
            ${habit.description ? `<div class="habit-item-description">${habit.description}</div>` : ''}
            <div class="habit-item-stats">
                <div class="habit-item-stat">
                    <div class="habit-item-stat-value">${stats.streak}</div>
                    <div class="habit-item-stat-label">Current Streak</div>
                </div>
                <div class="habit-item-stat">
                    <div class="habit-item-stat-value">${stats.completion}%</div>
                    <div class="habit-item-stat-label">Completion Rate</div>
                </div>
                <div class="habit-item-stat">
                    <div class="habit-item-stat-value">${stats.longestStreak}</div>
                    <div class="habit-item-stat-label">Longest Streak</div>
                </div>
            </div>
            <div class="habit-item-actions">
                <button class="delete-btn" data-id="${habit.id}">Delete</button>
            </div>
        `;
        
        habitsList.appendChild(habitEl);
        
        // Add delete event listener
        const deleteBtn = habitEl.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteHabit(habit.id));
    });
}

// Calculate habit stats
function calculateHabitStats(habit) {
    const logs = habitLogs[habit.id] || [];
    
    // Calculate completion rate
    const totalDays = logs.length;
    const completedDays = logs.filter(log => log.completed).length;
    const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
    
    // Calculate current streak
    let currentStreak = 0;
    let longestStreak = 0;
    let streakCount = 0;
    
    // Sort logs by date (newest first)
    const sortedLogs = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Check if the most recent log is from today or yesterday
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    if (sortedLogs.length > 0) {
        const mostRecentDate = new Date(sortedLogs[0].date);
        mostRecentDate.setHours(0, 0, 0, 0);
        
        // If most recent log is not from today or yesterday, streak is 0
        if (mostRecentDate.getTime() !== today.getTime() && mostRecentDate.getTime() !== yesterday.getTime()) {
            currentStreak = 0;
        } else {
            // Calculate streak
            let prevDate = null;
            
            for (const log of sortedLogs) {
                if (log.completed) {
                    const logDate = new Date(log.date);
                    logDate.setHours(0, 0, 0, 0);
                    
                    if (prevDate === null) {
                        streakCount = 1;
                    } else {
                        const expectedDate = new Date(prevDate);
                        expectedDate.setDate(prevDate.getDate() - 1);
                        
                        if (logDate.getTime() === expectedDate.getTime()) {
                            streakCount++;
                        } else {
                            break;
                        }
                    }
                    
                    prevDate = logDate;
                } else {
                    break;
                }
            }
            
            currentStreak = streakCount;
        }
    }
    
    // Calculate longest streak
    streakCount = 0;
    
    // Sort logs by date (oldest first)
    const chronologicalLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    for (let i = 0; i < chronologicalLogs.length; i++) {
        if (chronologicalLogs[i].completed) {
            streakCount++;
            
            if (i === chronologicalLogs.length - 1 || !chronologicalLogs[i + 1].completed) {
                longestStreak = Math.max(longestStreak, streakCount);
                streakCount = 0;
            }
        } else {
            streakCount = 0;
        }
    }
    
    return {
        completion: completionRate,
        streak: currentStreak,
        longestStreak: longestStreak
    };
}

// Render habit grid
function renderHabitGrid() {
    habitGridContent.innerHTML = '';
    
    if (habits.length === 0) {
        habitGridContent.innerHTML = '<div class="no-habits-grid">No habits to display</div>';
        return;
    }
    
    // Get date range for current view
    const { startDate, endDate } = getDateRange();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Generate dates array
    const dates = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Update grid header
    const gridHeader = document.querySelector('.habit-grid-header');
    gridHeader.innerHTML = '<div class="habit-grid-header-cell">Habit</div>';
    
    if (currentView === 'week') {
        // Show day names for week view
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        dayNames.forEach(day => {
            gridHeader.innerHTML += `<div class="habit-grid-header-cell">${day}</div>`;
        });
    } else {
        // Show dates for month/year view
        dates.slice(0, 7).forEach(date => {
            const day = date.getDate();
            const month = date.getMonth() + 1;
            gridHeader.innerHTML += `<div class="habit-grid-header-cell">${day}/${month}</div>`;
        });
    }
    
    // Create habit rows
    habits.forEach(habit => {
        const habitRow = document.createElement('div');
        habitRow.className = 'habit-row';
        
        // Add habit name
        const habitName = document.createElement('div');
        habitName.className = 'habit-name';
        habitName.textContent = habit.name;
        habitRow.appendChild(habitName);
        
        // Add habit cells for each date
        dates.slice(0, 7).forEach(date => {
            const dateStr = formatDate(date);
            const cell = document.createElement('div');
            cell.className = 'habit-cell';
            cell.dataset.date = dateStr;
            cell.dataset.habitId = habit.id;
            
            // Check if habit is completed for this date
            const log = (habitLogs[habit.id] || []).find(log => log.date === dateStr);
            
            if (log && log.completed) {
                cell.classList.add('completed');
                cell.innerHTML = '✓';
            }
            
            // Add click event listener
            cell.addEventListener('click', () => toggleHabitCompletion(habit.id, dateStr, cell));
            
            habitRow.appendChild(cell);
        });
        
        habitGridContent.appendChild(habitRow);
    });
}

// Toggle habit completion
async function toggleHabitCompletion(habitId, date, cell) {
    try {
        if (!dbService.currentUser) {
            showToast('You must be logged in to update habits', 'error');
            return;
        }

        // Get current completion status
        const log = (habitLogs[habitId] || []).find(log => log.date === date);
        const completed = !(log && log.completed);
        
        // Update habit log
        const result = await dbService.updateHabitLog(habitId, date, completed);
        
        if (result.offline) {
            showToast('Habit updated locally. Will sync when online.');
        }
        
        // Update UI
        if (completed) {
            cell.classList.add('completed');
            cell.innerHTML = '✓';
        } else {
            cell.classList.remove('completed');
            cell.innerHTML = '';
        }
        
        // Update local habit logs data structure
        if (!habitLogs[habitId]) {
            habitLogs[habitId] = [];
        }
        
        const existingLogIndex = habitLogs[habitId].findIndex(log => log.date === date);
        
        if (existingLogIndex >= 0) {
            // Update existing log
            habitLogs[habitId][existingLogIndex].completed = completed;
        } else {
            // Add new log
            habitLogs[habitId].push({
                habitId,
                date,
                completed,
                notes: ''
            });
        }
        
        // Refresh habit logs from database to ensure consistency
        const { startDate, endDate } = getDateRange();
        const logs = await dbService.getHabitLogs(habitId, startDate, endDate);
        habitLogs[habitId] = logs;
        
        // Re-render habits to update stats
        renderHabits();
    } catch (error) {
        console.error('Error toggling habit completion:', error);
        showToast('Error updating habit', 'error');
    }
}

// Show habit form
function showHabitForm() {
    habitsSection.querySelector('.section-header').classList.add('hidden');
    habitsSection.querySelector('.habits-container').classList.add('hidden');
    habitForm.classList.remove('hidden');
}

// Hide habit form
function hideHabitForm() {
    habitForm.classList.add('hidden');
    habitsSection.querySelector('.section-header').classList.remove('hidden');
    habitsSection.querySelector('.habits-container').classList.remove('hidden');
    newHabitForm.reset();
    customDaysGroup.classList.add('hidden');
}

// Handle frequency change
function handleFrequencyChange() {
    const frequency = habitFrequencySelect.value;
    
    if (frequency === 'custom') {
        customDaysGroup.classList.remove('hidden');
    } else {
        customDaysGroup.classList.add('hidden');
    }
}

// Save habit
async function saveHabit(e) {
    e.preventDefault();
    
    if (!dbService.currentUser) {
        showToast('You must be logged in to save habits', 'error');
        return;
    }
    
    // Get form data
    const name = document.getElementById('habit-name').value;
    const description = document.getElementById('habit-description').value;
    const frequency = document.getElementById('habit-frequency').value;
    
    // Validate form data
    if (!name) {
        showToast('Habit name is required', 'error');
        return;
    }
    
    if (!frequency) {
        showToast('Frequency is required', 'error');
        return;
    }
    
    // Get custom days if frequency is custom
    let customDays = [];
    if (frequency === 'custom') {
        const checkboxes = document.querySelectorAll('input[name="custom-days"]:checked');
        customDays = Array.from(checkboxes).map(cb => cb.value);
        
        if (customDays.length === 0) {
            showToast('Please select at least one day', 'error');
            return;
        }
    }
    
    // Create habit data
    const habitData = {
        name,
        description,
        frequency,
        customDays: frequency === 'custom' ? customDays : []
    };
    
    try {
        // Add habit to database
        const result = await dbService.addHabit(habitData);
        
        if (result.offline) {
            showToast('Habit saved locally. Will sync when online.');
        } else {
            showToast('Habit saved successfully!');
        }
        
        // Reset form and hide
        hideHabitForm();
        
        // Reload habits
        loadHabits();
    } catch (error) {
        console.error('Error saving habit:', error);
        showToast('Error saving habit. Please try again.', 'error');
    }
}

// Delete habit
async function deleteHabit(habitId) {
    if (!confirm('Are you sure you want to delete this habit?')) return;
    
    if (!dbService.currentUser) {
        showToast('You must be logged in to delete habits', 'error');
        return;
    }
    
    try {
        // Delete habit from database
        await dbService.deleteHabit(habitId);
        showToast('Habit deleted successfully');
        
        // Reload habits
        loadHabits();
    } catch (error) {
        console.error('Error deleting habit:', error);
        showToast('Error deleting habit. Please try again.', 'error');
    }
}

// Export functions
window.initHabitTracker = initHabitTracker;
window.loadHabits = loadHabits;
