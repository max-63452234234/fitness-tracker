// Measurements Chart Implementation
document.addEventListener('DOMContentLoaded', () => {
    // Register a custom event listener to render chart when measurements are loaded
    document.addEventListener('measurementsLoaded', (event) => {
        const measurements = event.detail.measurements;
        renderMeasurementsChart(measurements);
    });
});

/**
 * Renders a chart of measurements using Chart.js
 * @param {Array} measurements - Array of measurement objects
 */
function renderMeasurementsChart(measurements) {
    const chartContainer = document.getElementById('measurements-chart');
    
    // Clear previous chart
    chartContainer.innerHTML = '';
    
    // If no measurements, show a message
    if (!measurements || measurements.length === 0) {
        chartContainer.innerHTML = '<p class="no-data">No measurement data available. Add your first measurement!</p>';
        return;
    }

    // Sort measurements by date (oldest first for charting)
    const sortedMeasurements = [...measurements].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
    );
    
    // Create canvas for chart
    const canvas = document.createElement('canvas');
    canvas.id = 'measurementsCanvas';
    chartContainer.appendChild(canvas);
    
    // Format dates for labels
    const labels = sortedMeasurements.map(m => {
        const date = new Date(m.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    // Prepare datasets
    const datasets = [];
    
    // Weight dataset (if available)
    const weightData = sortedMeasurements.map(m => m.weight);
    if (weightData.some(w => w !== null && w !== undefined)) {
        datasets.push({
            label: 'Weight (kg)',
            data: weightData,
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            fill: true,
            tension: 0.4
        });
    }
    
    // Body fat dataset (if available)
    const bodyFatData = sortedMeasurements.map(m => m.bodyFat);
    if (bodyFatData.some(bf => bf !== null && bf !== undefined)) {
        datasets.push({
            label: 'Body Fat (%)',
            data: bodyFatData,
            borderColor: '#2196F3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            fill: true,
            tension: 0.4,
            yAxisID: 'percentage'
        });
    }
    
    // Measurements datasets (if available)
    const measurementTypes = [
        { key: 'chest', label: 'Chest (cm)', color: '#FF9800' },
        { key: 'waist', label: 'Waist (cm)', color: '#F44336' },
        { key: 'hips', label: 'Hips (cm)', color: '#9C27B0' },
        { key: 'arms', label: 'Arms (cm)', color: '#009688' },
        { key: 'thighs', label: 'Thighs (cm)', color: '#795548' }
    ];
    
    measurementTypes.forEach(type => {
        const data = sortedMeasurements.map(m => m[type.key]);
        if (data.some(value => value !== null && value !== undefined)) {
            datasets.push({
                label: type.label,
                data: data,
                borderColor: type.color,
                backgroundColor: 'rgba(0, 0, 0, 0)', // Transparent
                borderDash: [5, 5],
                fill: false,
                tension: 0.4,
                hidden: true // Hide by default to avoid cluttering
            });
        }
    });
    
    // Create chart
    new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    onClick: function(e, legendItem, legend) {
                        // Toggle dataset visibility with custom logic
                        const index = legendItem.datasetIndex;
                        const ci = legend.chart;
                        const meta = ci.getDatasetMeta(index);
                        
                        // Toggle or set the hidden state
                        meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
                        
                        // Update the chart
                        ci.update();
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Weight (kg) & Measurements (cm)'
                    },
                    beginAtZero: false
                },
                percentage: {
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Body Fat (%)'
                    },
                    beginAtZero: true,
                    max: 50,
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
    
    // Add stats under the chart
    const entryCount = sortedMeasurements.length;
    const firstDate = new Date(sortedMeasurements[0].date);
    const lastDate = new Date(sortedMeasurements[entryCount - 1].date);
    const daysDiff = Math.round((lastDate - firstDate) / (1000 * 60 * 60 * 24));
    
    let weightChange = '';
    if (sortedMeasurements[0].weight && sortedMeasurements[entryCount - 1].weight) {
        const initialWeight = sortedMeasurements[0].weight;
        const currentWeight = sortedMeasurements[entryCount - 1].weight;
        const weightDiff = currentWeight - initialWeight;
        const weightPercentage = (weightDiff / initialWeight) * 100;
        weightChange = `${weightDiff.toFixed(1)} kg (${weightPercentage.toFixed(1)}%)`;
    }
    
    const statsHTML = `
        <div class="chart-stats">
            <div class="chart-stat">
                <div class="value">${entryCount}</div>
                <div class="label">ENTRIES</div>
            </div>
            <div class="chart-stat">
                <div class="value">${weightChange || 'N/A'}</div>
                <div class="label">CHANGE</div>
            </div>
            <div class="chart-stat">
                <div class="value">${daysDiff || 0}</div>
                <div class="label">DAYS</div>
            </div>
        </div>
    `;
    
    const statsContainer = document.createElement('div');
    statsContainer.className = 'chart-statistics';
    statsContainer.innerHTML = statsHTML;
    chartContainer.appendChild(statsContainer);
}

// Add a function to trigger the event when measurements are loaded
function updateMeasurementsChart(measurements) {
    const event = new CustomEvent('measurementsLoaded', {
        detail: { measurements: measurements }
    });
    document.dispatchEvent(event);
}

// Export the update function to make it available to the main app
window.updateMeasurementsChart = updateMeasurementsChart;
