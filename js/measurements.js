// Measurements module for the fitness tracker app

// DOM Elements
const measurementsSection = document.getElementById('measurements');
const addMeasurementBtn = document.getElementById('add-measurement-btn');
const measurementForm = document.getElementById('measurement-form');
const newMeasurementForm = document.getElementById('new-measurement-form');
const cancelMeasurementBtn = document.getElementById('cancel-measurement-btn');
const measurementsList = document.getElementById('measurements-list');

// Initialize measurements module
function initMeasurements() {
    // Event Listeners
    addMeasurementBtn.addEventListener('click', showMeasurementForm);
    cancelMeasurementBtn.addEventListener('click', hideMeasurementForm);
    newMeasurementForm.addEventListener('submit', saveMeasurement);
}

// Show measurement form
function showMeasurementForm() {
    measurementsSection.querySelector('.section-header').classList.add('hidden');
    measurementsSection.querySelector('.measurements-container').classList.add('hidden');
    measurementForm.classList.remove('hidden');
    
    // Set default date value
    document.getElementById('measurement-date').valueAsDate = new Date();
}

// Hide measurement form
function hideMeasurementForm() {
    measurementForm.classList.add('hidden');
    measurementsSection.querySelector('.section-header').classList.remove('hidden');
    measurementsSection.querySelector('.measurements-container').classList.remove('hidden');
    newMeasurementForm.reset();
}

// Save measurement
async function saveMeasurement(e) {
    e.preventDefault();
    
    if (!dbService.currentUser) {
        showToast('You must be logged in to save measurements', 'error');
        return;
    }
    
    // Validate form data - at least one measurement should be provided
    const weight = document.getElementById('measurement-weight').value;
    const height = document.getElementById('measurement-height').value;
    const bodyFat = document.getElementById('measurement-body-fat').value;
    const chest = document.getElementById('measurement-chest').value;
    const waist = document.getElementById('measurement-waist').value;
    const hips = document.getElementById('measurement-hips').value;
    const arms = document.getElementById('measurement-arms').value;
    const thighs = document.getElementById('measurement-thighs').value;
    
    if (!weight && !height && !bodyFat && !chest && !waist && !hips && !arms && !thighs) {
        showToast('At least one measurement is required', 'error');
        return;
    }
    
    setLoading(true, addMeasurementBtn);
    
    const measurementData = {
        date: document.getElementById('measurement-date').value,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        bodyFat: bodyFat ? parseFloat(bodyFat) : null,
        chest: chest ? parseFloat(chest) : null,
        waist: waist ? parseFloat(waist) : null,
        hips: hips ? parseFloat(hips) : null,
        arms: arms ? parseFloat(arms) : null,
        thighs: thighs ? parseFloat(thighs) : null,
        notes: document.getElementById('measurement-notes').value
    };
    
    try {
        // Add measurement using database service
        const result = await dbService.addMeasurement(measurementData);
        
        if (result.offline) {
            showToast('Measurement saved locally. Will sync when online.');
        } else {
            showToast('Measurement saved successfully!');
        }
        
        // Reset form and show measurements section
        hideMeasurementForm();
        
        // Reload measurements to show the new measurement
        loadMeasurements();
    } catch (error) {
        console.error('Error saving measurement:', error);
        showToast('Error saving measurement. Please try again.', 'error');
    } finally {
        setLoading(false, addMeasurementBtn);
    }
}

// Load measurements
async function loadMeasurements() {
    if (!dbService.currentUser) return;
    
    try {
        // Get user's measurements
        const measurements = await dbService.getMeasurements();
        
        // Render measurements list
        renderMeasurements(measurements);
        
        // Update measurements chart (using the function from measurements-chart.js)
        if (typeof updateMeasurementsChart === 'function') {
            updateMeasurementsChart(measurements);
        }
    } catch (error) {
        console.error('Error loading measurements:', error);
        showToast('Error loading measurements', 'error');
    }
}

// Render measurements list
function renderMeasurements(measurements) {
    measurementsList.innerHTML = '';
    
    if (measurements.length === 0) {
        measurementsList.innerHTML = '<p class="no-measurements">No measurements yet. Add your first measurement!</p>';
        return;
    }
    
    // Sort measurements by date (newest first)
    const sortedMeasurements = [...measurements].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    sortedMeasurements.forEach(measurement => {
        const measurementEl = document.createElement('div');
        measurementEl.className = 'measurement-item';
        
        // Format date
        const measurementDate = new Date(measurement.date);
        const formattedDate = measurementDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        
        // Create measurement details HTML
        let detailsHTML = '<div class="measurement-details">';
        
        if (measurement.weight) {
            detailsHTML += `
                <div class="measurement-detail">
                    <span class="detail-label">Weight</span>
                    <span class="detail-value">${measurement.weight} kg</span>
                </div>
            `;
        }
        
        if (measurement.height) {
            detailsHTML += `
                <div class="measurement-detail">
                    <span class="detail-label">Height</span>
                    <span class="detail-value">${measurement.height} cm</span>
                </div>
            `;
        }
        
        if (measurement.bodyFat) {
            detailsHTML += `
                <div class="measurement-detail">
                    <span class="detail-label">Body Fat</span>
                    <span class="detail-value">${measurement.bodyFat}%</span>
                </div>
            `;
        }
        
        if (measurement.chest) {
            detailsHTML += `
                <div class="measurement-detail">
                    <span class="detail-label">Chest</span>
                    <span class="detail-value">${measurement.chest} cm</span>
                </div>
            `;
        }
        
        if (measurement.waist) {
            detailsHTML += `
                <div class="measurement-detail">
                    <span class="detail-label">Waist</span>
                    <span class="detail-value">${measurement.waist} cm</span>
                </div>
            `;
        }
        
        if (measurement.hips) {
            detailsHTML += `
                <div class="measurement-detail">
                    <span class="detail-label">Hips</span>
                    <span class="detail-value">${measurement.hips} cm</span>
                </div>
            `;
        }
        
        if (measurement.arms) {
            detailsHTML += `
                <div class="measurement-detail">
                    <span class="detail-label">Arms</span>
                    <span class="detail-value">${measurement.arms} cm</span>
                </div>
            `;
        }
        
        if (measurement.thighs) {
            detailsHTML += `
                <div class="measurement-detail">
                    <span class="detail-label">Thighs</span>
                    <span class="detail-value">${measurement.thighs} cm</span>
                </div>
            `;
        }
        
        if (measurement.notes) {
            detailsHTML += `
                <div class="measurement-detail">
                    <span class="detail-label">Notes</span>
                    <span class="detail-value">${measurement.notes}</span>
                </div>
            `;
        }
        
        detailsHTML += '</div>';
        
        measurementEl.innerHTML = `
            <div class="measurement-info">
                <h4>${formattedDate}</h4>
                ${detailsHTML}
            </div>
            <div class="measurement-actions">
                <button class="delete-btn" data-id="${measurement.id}">Delete</button>
            </div>
        `;
        
        measurementsList.appendChild(measurementEl);
        
        // Add delete event listener
        const deleteBtn = measurementEl.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteMeasurement(measurement.id));
    });
}

// Delete measurement
async function deleteMeasurement(measurementId) {
    if (!confirm('Are you sure you want to delete this measurement?')) return;
    
    if (!dbService.currentUser) {
        showToast('You must be logged in to delete measurements', 'error');
        return;
    }
    
    setLoading(true, addMeasurementBtn);
    
    try {
        await dbService.deleteMeasurement(measurementId);
        showToast('Measurement deleted successfully');
        
        // Reload measurements
        loadMeasurements();
    } catch (error) {
        console.error('Error deleting measurement:', error);
        showToast('Error deleting measurement. Please try again.', 'error');
    } finally {
        setLoading(false, addMeasurementBtn);
    }
}

// Export functions for use in other modules
window.initMeasurements = initMeasurements;
window.loadMeasurements = loadMeasurements;
