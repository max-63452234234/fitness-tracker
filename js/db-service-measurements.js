// Measurements Service for Fitness Tracker
// This file contains measurement data management functionality

// Extend the GoalsDatabaseService class
class MeasurementsDatabaseService extends GoalsDatabaseService {
    constructor() {
        super();
    }
    
    // Get measurements
    async getMeasurements() {
        try {
            // In a real app, this would get measurements from the server
            // For demo purposes, we'll use a mock implementation
            
            if (!this.currentUser) {
                throw new Error('User not authenticated');
            }
            
            // If using PostgreSQL
            if (this.dbType === 'postgres') {
                const result = await this.db.query(
                    'SELECT * FROM measurements WHERE user_id = $1 ORDER BY date DESC',
                    [this.currentUser.id]
                );
                
                // If offline, return mock data
                if (result.offline) {
                    return Object.values(this.offlineStorage.measurements || {})
                        .filter(m => m.userId === this.currentUser.id)
                        .sort((a, b) => new Date(b.date) - new Date(a.date));
                }
                
                // Format measurements
                return result.rows.map(row => ({
                    id: row.id,
                    date: row.date,
                    weight: row.weight,
                    height: row.height,
                    bodyFat: row.body_fat,
                    chest: row.chest,
                    waist: row.waist,
                    hips: row.hips,
                    arms: row.arms,
                    thighs: row.thighs,
                    notes: row.notes
                }));
            }
            
            // If offline mode
            return Object.values(this.offlineStorage.measurements || {})
                .filter(m => m.userId === this.currentUser.id)
                .sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (error) {
            console.error('Error getting measurements:', error);
            throw error;
        }
    }
    
    // Add measurement
    async addMeasurement(measurementData) {
        try {
            // In a real app, this would add a measurement to the server
            // For demo purposes, we'll use a mock implementation
            
            if (!this.currentUser) {
                throw new Error('User not authenticated');
            }
            
            const measurement = {
                ...measurementData,
                userId: this.currentUser.id,
                createdAt: new Date().toISOString()
            };
            
            // If offline or using offline storage
            if (this.offlineMode || !navigator.onLine) {
                const measurementId = Math.floor(Math.random() * 1000);
                measurement.id = measurementId;
                
                // Save to offline storage
                if (!this.offlineStorage.measurements) {
                    this.offlineStorage.measurements = {};
                }
                this.offlineStorage.measurements[measurementId] = measurement;
                this.saveOfflineData();
                
                // Add to pending sync
                this.pendingSync.push({
                    type: 'addMeasurement',
                    data: measurement
                });
                
                return { id: measurementId, offline: true };
            }
            
            // If using PostgreSQL
            if (this.dbType === 'postgres') {
                const result = await this.db.query(
                    `INSERT INTO measurements (
                        user_id, date, weight, height, body_fat, 
                        chest, waist, hips, arms, thighs, notes
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
                    [
                        this.currentUser.id,
                        measurement.date,
                        measurement.weight,
                        measurement.height,
                        measurement.bodyFat,
                        measurement.chest,
                        measurement.waist,
                        measurement.hips,
                        measurement.arms,
                        measurement.thighs,
                        measurement.notes
                    ]
                );
                
                return { id: result.rows[0].id };
            }
            
            return { id: Math.floor(Math.random() * 1000) };
        } catch (error) {
            console.error('Error adding measurement:', error);
            throw error;
        }
    }
    
    // Delete measurement
    async deleteMeasurement(measurementId) {
        try {
            // In a real app, this would delete a measurement from the server
            // For demo purposes, we'll use a mock implementation
            
            if (!this.currentUser) {
                throw new Error('User not authenticated');
            }
            
            // If offline or using offline storage
            if (this.offlineMode || !navigator.onLine) {
                // Remove from offline storage
                if (this.offlineStorage.measurements && this.offlineStorage.measurements[measurementId]) {
                    delete this.offlineStorage.measurements[measurementId];
                    this.saveOfflineData();
                }
                
                // Add to pending sync
                this.pendingSync.push({
                    type: 'deleteMeasurement',
                    data: { id: measurementId }
                });
                
                return { success: true, offline: true };
            }
            
            // If using PostgreSQL
            if (this.dbType === 'postgres') {
                await this.db.query(
                    'DELETE FROM measurements WHERE id = $1 AND user_id = $2',
                    [measurementId, this.currentUser.id]
                );
                
                return { success: true };
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error deleting measurement:', error);
            throw error;
        }
    }
}

// Export the MeasurementsDatabaseService
window.MeasurementsDatabaseService = MeasurementsDatabaseService;
