// Workouts Service for Fitness Tracker
// This file contains workout data management functionality

// Extend the AuthDatabaseService class
class WorkoutsDatabaseService extends AuthDatabaseService {
    constructor() {
        super();
    }
    
    // Get workouts
    async getWorkouts() {
        try {
            // In a real app, this would get workouts from the server
            // For demo purposes, we'll use a mock implementation
            
            if (!this.currentUser) {
                throw new Error('User not authenticated');
            }
            
            // If using PostgreSQL
            if (this.dbType === 'postgres') {
                const result = await this.db.query(
                    'SELECT * FROM workouts WHERE user_id = $1 ORDER BY date DESC',
                    [this.currentUser.id]
                );
                
                // If offline, return mock data
                if (result.offline) {
                    return Object.values(this.offlineStorage.workouts || {})
                        .filter(w => w.userId === this.currentUser.id)
                        .sort((a, b) => new Date(b.date) - new Date(a.date));
                }
                
                // Format workouts
                return result.rows.map(row => ({
                    id: row.id,
                    date: row.date,
                    type: row.type,
                    duration: row.duration,
                    intensity: row.intensity,
                    notes: row.notes
                }));
            }
            
            // If offline mode
            return Object.values(this.offlineStorage.workouts || {})
                .filter(w => w.userId === this.currentUser.id)
                .sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (error) {
            console.error('Error getting workouts:', error);
            throw error;
        }
    }
    
    // Add workout
    async addWorkout(workoutData) {
        try {
            // In a real app, this would add a workout to the server
            // For demo purposes, we'll use a mock implementation
            
            if (!this.currentUser) {
                throw new Error('User not authenticated');
            }
            
            const workout = {
                ...workoutData,
                userId: this.currentUser.id,
                timestamp: new Date().toISOString()
            };
            
            // If offline or using offline storage
            if (this.offlineMode || !navigator.onLine) {
                const workoutId = Math.floor(Math.random() * 1000);
                workout.id = workoutId;
                
                // Save to offline storage
                if (!this.offlineStorage.workouts) {
                    this.offlineStorage.workouts = {};
                }
                this.offlineStorage.workouts[workoutId] = workout;
                this.saveOfflineData();
                
                // Add to pending sync
                this.pendingSync.push({
                    type: 'addWorkout',
                    data: workout
                });
                
                return { id: workoutId, offline: true };
            }
            
            // If using PostgreSQL
            if (this.dbType === 'postgres') {
                const result = await this.db.query(
                    `INSERT INTO workouts (user_id, date, type, duration, intensity, notes) 
                     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                    [
                        this.currentUser.id,
                        workout.date,
                        workout.type,
                        workout.duration,
                        workout.intensity,
                        workout.notes
                    ]
                );
                
                return { id: result.rows[0].id };
            }
            
            return { id: Math.floor(Math.random() * 1000) };
        } catch (error) {
            console.error('Error adding workout:', error);
            throw error;
        }
    }
    
    // Delete workout
    async deleteWorkout(workoutId) {
        try {
            // In a real app, this would delete a workout from the server
            // For demo purposes, we'll use a mock implementation
            
            if (!this.currentUser) {
                throw new Error('User not authenticated');
            }
            
            // If offline or using offline storage
            if (this.offlineMode || !navigator.onLine) {
                // Remove from offline storage
                if (this.offlineStorage.workouts && this.offlineStorage.workouts[workoutId]) {
                    delete this.offlineStorage.workouts[workoutId];
                    this.saveOfflineData();
                }
                
                // Add to pending sync
                this.pendingSync.push({
                    type: 'deleteWorkout',
                    data: { id: workoutId }
                });
                
                return { success: true, offline: true };
            }
            
            // If using PostgreSQL
            if (this.dbType === 'postgres') {
                await this.db.query(
                    'DELETE FROM workouts WHERE id = $1 AND user_id = $2',
                    [workoutId, this.currentUser.id]
                );
                
                return { success: true };
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error deleting workout:', error);
            throw error;
        }
    }
}

// Export the WorkoutsDatabaseService
window.WorkoutsDatabaseService = WorkoutsDatabaseService;
