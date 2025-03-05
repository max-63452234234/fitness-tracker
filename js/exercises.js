// Exercise Tracker Functionality

// DOM Elements
const addExerciseBtn = document.getElementById('add-exercise-btn');
const exerciseCalendar = document.querySelector('.exercise-calendar');
const dailyExercises = document.getElementById('daily-exercises');
const backToCalendarBtn = document.getElementById('back-to-calendar');
const calendarGrid = document.getElementById('calendar-grid');
const currentMonthYear = document.getElementById('current-month-year');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const selectedDateEl = document.getElementById('selected-date');
const exercisesList = document.getElementById('exercises-list');
const logExerciseBtn = document.getElementById('log-exercise-btn');
const exerciseForm = document.getElementById('exercise-form');
const newExerciseForm = document.getElementById('new-exercise-form');
const exerciseTypeSelect = document.getElementById('exercise-type');
const exerciseStrengthFields = document.querySelectorAll('.exercise-strength-fields');
const exerciseCardioFields = document.querySelectorAll('.exercise-cardio-fields');
const cancelExerciseBtn = document.getElementById('cancel-exercise-btn');

// State
let currentDate = new Date();
let selectedDate = new Date();
let exercises = [];
let editExerciseId = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initExerciseTracker();
});

// Initialize the exercise tracker
function initExerciseTracker() {
    // Set today's date as default in the form
    const today = new Date();
    const formattedDate = formatDateForInput(today);
    document.getElementById('exercise-date').value = formattedDate;

    // Add event listeners
    addExerciseBtn.addEventListener('click', openExerciseForm);
    logExerciseBtn.addEventListener('click', openExerciseForm);
    backToCalendarBtn.addEventListener('click', showCalendarView);
    prevMonthBtn.addEventListener('click', () => navigateMonth(-1));
    nextMonthBtn.addEventListener('click', () => navigateMonth(1));
    exerciseTypeSelect.addEventListener('change', toggleExerciseFields);
    cancelExerciseBtn.addEventListener('click', closeExerciseForm);
    newExerciseForm.addEventListener('submit', handleExerciseSubmit);

    // Generate initial calendar
    generateCalendar(currentDate);

    // Load exercises if user is authenticated
    if (dbService.checkAuthState()) {
        loadExercises();
    }
}

// Toggle exercise type specific fields
function toggleExerciseFields() {
    const selectedType = exerciseTypeSelect.value;
    
    // Toggle strength fields
    exerciseStrengthFields.forEach(field => {
        if (selectedType === 'strength') {
            field.classList.remove('hidden');
        } else {
            field.classList.add('hidden');
        }
    });
    
    // Toggle cardio fields
    exerciseCardioFields.forEach(field => {
        if (selectedType === 'cardio') {
            field.classList.remove('hidden');
        } else {
            field.classList.add('hidden');
        }
    });
}

// Format date for input fields (YYYY-MM-DD)
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format date for display (Month Day, Year)
function formatDateForDisplay(date) {
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Generate calendar for the given month
function generateCalendar(date) {
    // Update month/year display
    const options = { month: 'long', year: 'numeric' };
    currentMonthYear.textContent = date.toLocaleDateString('en-US', options);
    
    // Clear existing calendar
    calendarGrid.innerHTML = '';
    
    // Add day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });
    
    // Get first day of month and total days
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const totalDays = lastDay.getDate();
    
    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDay.getDay(); i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyDay);
    }
    
    // Add days of the month
    for (let i = 1; i <= totalDays; i++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        
        const dayContent = document.createElement('div');
        dayContent.className = 'day-content';
        
        const dayNumber = document.createElement('span');
        dayNumber.className = 'day-number';
        dayNumber.textContent = i;
        dayContent.appendChild(dayNumber);
        
        // Create date for this day
        const cellDate = new Date(date.getFullYear(), date.getMonth(), i);
        
        // Check if this day has exercises
        const hasExercises = exercises.some(exercise => {
            const exerciseDate = new Date(exercise.date);
            return exerciseDate.toDateString() === cellDate.toDateString();
        });
        
        if (hasExercises) {
            const indicator = document.createElement('div');
            indicator.className = 'exercise-indicator';
            dayContent.appendChild(indicator);
        }
        
        // Check if this is today
        if (cellDate.toDateString() === new Date().toDateString()) {
            dayCell.classList.add('today');
        }
        
        // Check if this is the selected date
        if (cellDate.toDateString() === selectedDate.toDateString()) {
            dayCell.classList.add('selected');
        }
        
        // Add click event to view exercises for this day
        dayCell.addEventListener('click', () => {
            selectedDate = cellDate;
            showDailyView(cellDate);
        });
        
        dayCell.appendChild(dayContent);
        calendarGrid.appendChild(dayCell);
    }
    
    // Add empty cells for days after last day of month to complete the grid
    const lastDayOfWeek = lastDay.getDay();
    if (lastDayOfWeek < 6) {
        for (let i = lastDayOfWeek + 1; i <= 6; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyDay);
        }
    }
}

// Navigate to previous/next month
function navigateMonth(direction) {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1);
    generateCalendar(currentDate);
}

// Show daily exercises view
function showDailyView(date) {
    // Update selected date display
    selectedDateEl.textContent = formatDateForDisplay(date);
    
    // Hide calendar, show daily view
    exerciseCalendar.classList.add('hidden');
    dailyExercises.classList.remove('hidden');
    
    // Load exercises for this day
    loadDailyExercises(date);
}

// Show calendar view
function showCalendarView() {
    // Hide daily view, show calendar
    dailyExercises.classList.add('hidden');
    exerciseCalendar.classList.remove('hidden');
    
    // Regenerate calendar with updated data
    generateCalendar(currentDate);
}

// Load all exercises
async function loadExercises() {
    try {
        // Get exercises from database service
        const result = await dbService.getExercises();
        exercises = result;
        
        // Update calendar to reflect exercises
        generateCalendar(currentDate);
    } catch (error) {
        console.error('Error loading exercises:', error);
    }
}

// Load exercises for a specific day
function loadDailyExercises(date) {
    // Clear exercises list
    exercisesList.innerHTML = '';
    
    // Filter exercises for this day
    const dailyExercisesList = exercises.filter(exercise => {
        const exerciseDate = new Date(exercise.date);
        return exerciseDate.toDateString() === date.toDateString();
    });
    
    // Sort exercises by type
    dailyExercisesList.sort((a, b) => {
        if (a.type !== b.type) {
            return a.type.localeCompare(b.type);
        }
        return a.name.localeCompare(b.name);
    });
    
    // If no exercises, show empty state
    if (dailyExercisesList.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        
        const emptyText = document.createElement('p');
        emptyText.textContent = 'No exercises logged for this day.';
        
        const logButton = document.createElement('button');
        logButton.textContent = 'Log Exercise';
        logButton.addEventListener('click', openExerciseForm);
        
        emptyState.appendChild(emptyText);
        emptyState.appendChild(logButton);
        exercisesList.appendChild(emptyState);
        return;
    }
    
    // Create exercise cards for each exercise
    const exercisesByType = groupExercisesByType(dailyExercisesList);
    
    // Add each type group
    Object.keys(exercisesByType).forEach(type => {
        const typeGroup = document.createElement('div');
        typeGroup.className = 'exercise-type-group';
        
        const typeHeading = document.createElement('h4');
        typeHeading.className = 'exercise-type-heading';
        typeHeading.textContent = capitalizeFirstLetter(type);
        typeGroup.appendChild(typeHeading);
        
        // Add exercises for this type
        exercisesByType[type].forEach(exercise => {
            const exerciseCard = createExerciseCard(exercise);
            typeGroup.appendChild(exerciseCard);
        });
        
        exercisesList.appendChild(typeGroup);
    });
    
    // Add "Add Exercise" button at the bottom
    const addButton = document.createElement('button');
    addButton.className = 'add-more-btn';
    addButton.textContent = 'Add Another Exercise';
    addButton.addEventListener('click', openExerciseForm);
    exercisesList.appendChild(addButton);
}

// Group exercises by type
function groupExercisesByType(exercises) {
    return exercises.reduce((groups, exercise) => {
        const type = exercise.type || 'other';
        if (!groups[type]) {
            groups[type] = [];
        }
        groups[type].push(exercise);
        return groups;
    }, {});
}

// Create an exercise card
function createExerciseCard(exercise) {
    const card = document.createElement('div');
    card.className = 'exercise-card';
    card.dataset.id = exercise.id;
    
    const cardHeader = document.createElement('div');
    cardHeader.className = 'exercise-card-header';
    
    const exerciseName = document.createElement('h5');
    exerciseName.className = 'exercise-name';
    exerciseName.textContent = exercise.name;
    cardHeader.appendChild(exerciseName);
    
    const actions = document.createElement('div');
    actions.className = 'exercise-actions';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-exercise-btn';
    editBtn.innerHTML = '✏️';
    editBtn.addEventListener('click', () => editExercise(exercise));
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-exercise-btn';
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.addEventListener('click', () => deleteExercise(exercise.id));
    
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    cardHeader.appendChild(actions);
    
    card.appendChild(cardHeader);
    
    // Exercise details based on type
    const details = document.createElement('div');
    details.className = 'exercise-details';
    
    if (exercise.type === 'strength') {
        if (exercise.sets) {
            details.innerHTML += `<div><strong>Sets:</strong> ${exercise.sets}</div>`;
        }
        if (exercise.reps) {
            details.innerHTML += `<div><strong>Reps:</strong> ${exercise.reps}</div>`;
        }
        if (exercise.weight) {
            details.innerHTML += `<div><strong>Weight:</strong> ${exercise.weight} kg</div>`;
        }
    } else if (exercise.type === 'cardio') {
        if (exercise.duration) {
            details.innerHTML += `<div><strong>Duration:</strong> ${exercise.duration} min</div>`;
        }
        if (exercise.distance) {
            details.innerHTML += `<div><strong>Distance:</strong> ${exercise.distance} km</div>`;
        }
    }
    
    // Add notes if available
    if (exercise.notes) {
        const notesSection = document.createElement('div');
        notesSection.className = 'exercise-notes';
        notesSection.innerHTML = `<strong>Notes:</strong> ${exercise.notes}`;
        details.appendChild(notesSection);
    }
    
    card.appendChild(details);
    
    return card;
}

// Open exercise form to add or edit an exercise
function openExerciseForm(exerciseData = null) {
    // Set form date to selected date
    document.getElementById('exercise-date').value = formatDateForInput(selectedDate);
    
    // Clear previous form data
    newExerciseForm.reset();
    
    // Set default form state
    exerciseTypeSelect.value = '';
    toggleExerciseFields();
    
    // If editing, populate form with exercise data
    if (exerciseData) {
        editExerciseId = exerciseData.id;
        
        // Set form values
        document.getElementById('exercise-date').value = formatDateForInput(new Date(exerciseData.date));
        document.getElementById('exercise-name').value = exerciseData.name;
        document.getElementById('exercise-type').value = exerciseData.type;
        
        // Type-specific fields
        if (exerciseData.type === 'strength') {
            document.getElementById('exercise-sets').value = exerciseData.sets || '';
            document.getElementById('exercise-reps').value = exerciseData.reps || '';
            document.getElementById('exercise-weight').value = exerciseData.weight || '';
        } else if (exerciseData.type === 'cardio') {
            document.getElementById('exercise-distance').value = exerciseData.distance || '';
            document.getElementById('exercise-duration').value = exerciseData.duration || '';
        }
        
        document.getElementById('exercise-notes').value = exerciseData.notes || '';
        
        // Update field visibility
        toggleExerciseFields();
    } else {
        editExerciseId = null;
    }
    
    // Show form
    exerciseForm.classList.remove('hidden');
    document.querySelectorAll('.app-section').forEach(section => section.classList.add('hidden'));
}

// Close exercise form
function closeExerciseForm() {
    exerciseForm.classList.add('hidden');
    document.getElementById('exercises').classList.remove('hidden');
    editExerciseId = null;
}

// Handle exercise form submission
async function handleExerciseSubmit(e) {
    e.preventDefault();
    
    // Get form data
    const date = document.getElementById('exercise-date').value;
    const name = document.getElementById('exercise-name').value;
    const type = document.getElementById('exercise-type').value;
    
    // Build exercise data object
    const exerciseData = {
        date,
        name,
        type
    };
    
    // Add type-specific fields
    if (type === 'strength') {
        exerciseData.sets = parseInt(document.getElementById('exercise-sets').value) || null;
        exerciseData.reps = parseInt(document.getElementById('exercise-reps').value) || null;
        exerciseData.weight = parseFloat(document.getElementById('exercise-weight').value) || null;
    } else if (type === 'cardio') {
        exerciseData.distance = parseFloat(document.getElementById('exercise-distance').value) || null;
        exerciseData.duration = parseInt(document.getElementById('exercise-duration').value) || null;
    }
    
    exerciseData.notes = document.getElementById('exercise-notes').value;
    
    try {
        let result;
        
        if (editExerciseId) {
            // Update existing exercise
            result = await dbService.updateExercise(editExerciseId, exerciseData);
        } else {
            // Add new exercise
            result = await dbService.addExercise(exerciseData);
        }
        
        // Reload exercises and update view
        await loadExercises();
        const selectedDateObj = new Date(date);
        selectedDate = selectedDateObj;
        showDailyView(selectedDateObj);
        
        // Close form
        closeExerciseForm();
    } catch (error) {
        console.error('Error saving exercise:', error);
        alert(`Error saving exercise: ${error.message}`);
    }
}

// Edit an exercise
function editExercise(exercise) {
    openExerciseForm(exercise);
}

// Delete an exercise
async function deleteExercise(exerciseId) {
    if (confirm('Are you sure you want to delete this exercise?')) {
        try {
            await dbService.deleteExercise(exerciseId);
            
            // Reload exercises and update view
            await loadExercises();
            showDailyView(selectedDate);
        } catch (error) {
            console.error('Error deleting exercise:', error);
            alert(`Error deleting exercise: ${error.message}`);
        }
    }
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
