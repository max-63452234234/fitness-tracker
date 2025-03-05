// Utility functions for the fitness tracker app

// Show toast notification
function showToast(message, type = 'info') {
    // Create toast element if it doesn't exist
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
        
        // Add toast styles if not in CSS
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.padding = '12px 20px';
        toast.style.borderRadius = '4px';
        toast.style.backgroundColor = type === 'error' ? '#f44336' : '#4CAF50';
        toast.style.color = 'white';
        toast.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        toast.style.zIndex = '1000';
        toast.style.transition = 'opacity 0.3s';
    }
    
    // Set message and show toast
    toast.textContent = message;
    toast.style.opacity = '1';
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
    }, 3000);
}

// Handle online/offline status changes
function handleOnlineStatus() {
    const offlineMode = !navigator.onLine;
    
    if (offlineMode) {
        console.log('App is offline. Changes will be synced when back online.');
        showToast('You are offline. Changes will be saved locally and synced when you reconnect.');
    } else {
        console.log('Back online. Syncing pending workouts...');
        dbService.syncPendingWorkouts()
            .then(result => {
                if (result && result.syncedCount > 0) {
                    showToast(`Successfully synced ${result.syncedCount} workouts`);
                    if (typeof loadUserData === 'function') {
                        loadUserData();
                    }
                }
            })
            .catch(error => {
                console.error('Error syncing workouts:', error);
            });
    }
}

// Set loading state
function setLoading(loading, button) {
    if (!button) return;
    
    // Update UI based on loading state
    if (loading) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.textContent = 'Loading...';
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || 'Add';
    }
}

// Export functions for use in other modules
window.showToast = showToast;
window.handleOnlineStatus = handleOnlineStatus;
window.setLoading = setLoading;
