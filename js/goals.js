// Goals module for the fitness tracker app

// DOM Elements
const goalsSection = document.getElementById('goals');
const addGoalBtn = document.getElementById('add-goal-btn');
const goalForm = document.getElementById('goal-form');
const newGoalForm = document.getElementById('new-goal-form');
const cancelGoalBtn = document.getElementById('cancel-goal-btn');
const goalsList = document.getElementById('goals-list');

// Initialize goals module
function initGoals() {
    // Event Listeners
    addGoalBtn.addEventListener('click', showGoalForm);
    cancelGoalBtn.addEventListener('click', hideGoalForm);
    newGoalForm.addEventListener('submit', saveGoal);
}

// Show goal form
function showGoalForm() {
    goalsSection.querySelector('.section-header').classList.add('hidden');
    goalsSection.querySelector('.goals-container').classList.add('hidden');
    goalForm.classList.remove('hidden');
    
    // Set default date values
    document.getElementById('goal-start-date').valueAsDate = new Date();
    
    // Set target date to 30 days from now by default
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30);
    document.getElementById('goal-target-date').valueAsDate = targetDate;
}

// Hide goal form
function hideGoalForm() {
    goalForm.classList.add('hidden');
    goalsSection.querySelector('.section-header').classList.remove('hidden');
    goalsSection.querySelector('.goals-container').classList.remove('hidden');
    newGoalForm.reset();
}

// Save goal
async function saveGoal(e) {
    e.preventDefault();
    
    if (!dbService.currentUser) {
        showToast('You must be logged in to save goals', 'error');
        return;
    }
    
    // Validate form data
    const targetValue = parseFloat(document.getElementById('goal-target-value').value);
    const currentValue = parseFloat(document.getElementById('goal-current-value').value);
    
    if (isNaN(targetValue) || targetValue <= 0) {
        showToast('Target value must be a positive number', 'error');
        return;
    }
    
    if (isNaN(currentValue) || currentValue < 0) {
        showToast('Current value must be a non-negative number', 'error');
        return;
    }
    
    setLoading(true, addGoalBtn);
    
    const goalData = {
        title: document.getElementById('goal-title').value,
        description: document.getElementById('goal-description').value,
        category: document.getElementById('goal-category').value,
        targetValue: targetValue,
        currentValue: currentValue,
        unit: document.getElementById('goal-unit').value,
        startDate: document.getElementById('goal-start-date').value,
        targetDate: document.getElementById('goal-target-date').value || null,
        completed: false
    };
    
    try {
        // Add goal using database service
        const result = await dbService.addGoal(goalData);
        
        if (result.offline) {
            showToast('Goal saved locally. Will sync when online.');
        } else {
            showToast('Goal saved successfully!');
        }
        
        // Reset form and show goals section
        hideGoalForm();
        
        // Reload goals to show the new goal
        loadGoals();
    } catch (error) {
        console.error('Error saving goal:', error);
        showToast('Error saving goal. Please try again.', 'error');
    } finally {
        setLoading(false, addGoalBtn);
    }
}

// Load goals
async function loadGoals() {
    if (!dbService.currentUser) return;
    
    try {
        // Get user's goals
        const goals = await dbService.getGoals();
        
        // Render goals list
        renderGoals(goals);
    } catch (error) {
        console.error('Error loading goals:', error);
        showToast('Error loading goals', 'error');
    }
}

// Render goals list
function renderGoals(goals) {
    goalsList.innerHTML = '';
    
    if (goals.length === 0) {
        goalsList.innerHTML = '<p class="no-goals">No goals yet. Add your first goal!</p>';
        return;
    }
    
    goals.forEach(goal => {
        const goalEl = document.createElement('div');
        goalEl.className = 'goal-item';
        
        // Calculate progress percentage
        const progress = Math.min(100, (goal.currentValue / goal.targetValue) * 100);
        
        // Format dates
        const startDate = new Date(goal.startDate);
        const formattedStartDate = startDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
        
        let formattedTargetDate = 'No end date';
        if (goal.targetDate) {
            const targetDate = new Date(goal.targetDate);
            formattedTargetDate = targetDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        }
        
        // Capitalize category
        const category = goal.category.charAt(0).toUpperCase() + goal.category.slice(1);
        
        goalEl.innerHTML = `
            <div class="goal-info">
                <h4>${goal.title}</h4>
                <div class="goal-meta">
                    ${category} • ${formattedStartDate} to ${formattedTargetDate}
                </div>
                ${goal.description ? `<div class="goal-description">${goal.description}</div>` : ''}
                <div class="goal-progress">
                    <span>${goal.currentValue} / ${goal.targetValue} ${goal.unit}</span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
            </div>
            <div class="goal-actions">
                <button class="update-btn" data-id="${goal.id}">Update</button>
                <button class="delete-btn" data-id="${goal.id}">Delete</button>
            </div>
        `;
        
        goalsList.appendChild(goalEl);
        
        // Add event listeners
        const updateBtn = goalEl.querySelector('.update-btn');
        updateBtn.addEventListener('click', () => updateGoal(goal));
        
        const deleteBtn = goalEl.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteGoal(goal.id));
    });
}

// Update goal
function updateGoal(goal) {
    // Show goal form
    goalsSection.querySelector('.section-header').classList.add('hidden');
    goalsSection.querySelector('.goals-container').classList.add('hidden');
    goalForm.classList.remove('hidden');
    
    // Fill form with goal data
    document.getElementById('goal-title').value = goal.title;
    document.getElementById('goal-description').value = goal.description || '';
    document.getElementById('goal-category').value = goal.category;
    document.getElementById('goal-target-value').value = goal.targetValue;
    document.getElementById('goal-current-value').value = goal.currentValue;
    document.getElementById('goal-unit').value = goal.unit || '';
    document.getElementById('goal-start-date').value = goal.startDate;
    if (goal.targetDate) {
        document.getElementById('goal-target-date').value = goal.targetDate;
    }
    
    // Update form submit handler
    newGoalForm.onsubmit = async (e) => {
        e.preventDefault();
        
        if (!dbService.currentUser) {
            showToast('You must be logged in to update goals', 'error');
            return;
        }
        
        // Validate form data
        const targetValue = parseFloat(document.getElementById('goal-target-value').value);
        const currentValue = parseFloat(document.getElementById('goal-current-value').value);
        
        if (isNaN(targetValue) || targetValue <= 0) {
            showToast('Target value must be a positive number', 'error');
            return;
        }
        
        if (isNaN(currentValue) || currentValue < 0) {
            showToast('Current value must be a non-negative number', 'error');
            return;
        }
        
        setLoading(true, addGoalBtn);
        
        const goalData = {
            title: document.getElementById('goal-title').value,
            description: document.getElementById('goal-description').value,
            category: document.getElementById('goal-category').value,
            targetValue: targetValue,
            currentValue: currentValue,
            unit: document.getElementById('goal-unit').value,
            startDate: document.getElementById('goal-start-date').value,
            targetDate: document.getElementById('goal-target-date').value || null,
            completed: currentValue >= targetValue
        };
        
        try {
            // Update goal using database service
            await dbService.updateGoal(goal.id, goalData);
            showToast('Goal updated successfully!');
            
            // Reset form and show goals section
            hideGoalForm();
            
            // Reset form submit handler
            newGoalForm.onsubmit = saveGoal;
            
            // Reload goals to show the updated goal
            loadGoals();
        } catch (error) {
            console.error('Error updating goal:', error);
            showToast('Error updating goal. Please try again.', 'error');
        } finally {
            setLoading(false, addGoalBtn);
        }
    };
}

// Delete goal
async function deleteGoal(goalId) {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    
    if (!dbService.currentUser) {
        showToast('You must be logged in to delete goals', 'error');
        return;
    }
    
    setLoading(true, addGoalBtn);
    
    try {
        await dbService.deleteGoal(goalId);
        showToast('Goal deleted successfully');
        
        // Reload goals
        loadGoals();
    } catch (error) {
        console.error('Error deleting goal:', error);
        showToast('Error deleting goal. Please try again.', 'error');
    } finally {
        setLoading(false, addGoalBtn);
    }
}

// Export functions for use in other modules
window.initGoals = initGoals;
window.loadGoals = loadGoals;
