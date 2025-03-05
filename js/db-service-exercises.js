// Exercises Service for Fitness Tracker
// This file contains exercise data management functionality

// Extend the HabitsDatabaseService class
class ExercisesDatabaseService extends HabitsDatabaseService {
    constructor() {
        super();
    }
    
    // Get all exercises
    async getExercises() {
        try {
            // In a real app, this would get exercises from the server
            // For demo purposes, we'll use a mock implementation
            
            if (!this.currentUser) {
                throw new Error('User not authenticated');
            }
            
            // If using PostgreSQL
            if (this.dbType === 'postgres') {
                const result = await this.db.query(
                    `SELECT * FROM exercises 
                     WHERE user_id = $1 
                     ORDER BY date DESC, type ASC, name ASC`,
                    [this.currentUser.id]
                );
                
                // If offline, return mock data
                if (result.offline) {
                    return Object.values(this.offlineStorage.exercises || {})
                        .filter(ex => ex.userId === this.currentUser.id)
                        .sort((a, b) => {
                            // Sort by date (desc), then by type, then by name
                            const dateComparison = new Date(b.date) - new Date(a.date);
                            if (dateComparison !== 0) return dateComparison;
                            
                            const typeComparison = a.type.localeCompare(b.type);
                            if (typeComparison !== 0) return typeComparison;
                            
                            return a.name.localeCompare(b.name);
                        });
                }
                
                // Format exercises
                return result.rows.map(row => ({
                    id: row.id,
                    date: row.date,
                    name: row.name,
                    type: row.type,
                    sets: row.sets,
                    reps: row.reps,
                    weight: row.weight,
                    duration: row.duration,
                    distance: row.distance,
                    notes: row.notes
                }));
            }
            
            // If offline mode
            return Object.values(this.offlineStorage.exercises || {})
                .filter(ex => ex.userId === this.currentUser.id)
                .sort((a, b) => {
                    // Sort by date (desc), then by type, then by name
                    const dateComparison = new Date(b.date) - new Date(a.date);
                    if (dateComparison !== 0) return dateComparison;
                    
                    const typeComparison = a.type.localeCompare(b.type);
                    if (typeComparison !== 0) return typeComparison;
                    
                    return a.name.localeCompare(b.name);
                });
        } catch (error) {
            console.error('Error getting exercises:', error);
            throw error;
        }
    }
    
    // Add exercise
    async addExercise(exerciseData) {
        try {
            // In a real app, this would add an exercise to the server
            // For demo purposes, we'll use a mock implementation
            
            if (!this.currentUser) {
                throw new Error('User not authenticated');
            }
            
            const exercise = {
                ...exerciseData,
                userId: this.currentUser.id,
                createdAt: new Date().toISOString()
            };
            
            // If offline or using offline storage
            if (this.offlineMode || !navigator.onLine) {
                const exerciseId = Math.floor(Math.random() * 10000);
                exercise.id = exerciseId;
                
                // Initialize exercises storage if needed
                if (!this.offlineStorage.exercises) {
                    this.offlineStorage.exercises = {};
                }
                
                // Save to offline storage
                this.offlineStorage.exercises[exerciseId] = exercise;
                this.saveOfflineData();
                
                // Add to pending sync
                this.pendingSync.push({
                    type: 'addExercise',
                    data: exercise
                });
                
                return { id: exerciseId, offline: true };
            }
            
            // If using PostgreSQL
            if (this.dbType === 'postgres') {
                const result = await this.db.query(
                    `INSERT INTO exercises (
                        user_id, date, name, type, sets, reps, weight,
                        duration, distance, notes
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
                    [
                        this.currentUser.id,
                        exercise.date,
                        exercise.name,
                        exercise.type,
                        exercise.sets,
                        exercise.reps,
                        exercise.weight,
                        exercise.duration,
                        exercise.distance,
                        exercise.notes
                    ]
                );
                
                return { id: result.rows[0].id };
            }
            
            return { id: Math.floor(Math.random() * 10000) };
        } catch (error) {
            console.error('Error adding exercise:', error);
            throw error;
        }
    }
    
    // Update exercise
    async updateExercise(exerciseId, exerciseData) {
        try {
            // In a real app, this would update an exercise on the server
            // For demo purposes, we'll use a mock implementation
            
            if (!this.currentUser) {
                throw new Error('User not authenticated');
            }
            
            // If offline or using offline storage
            if (this.offlineMode || !navigator.onLine) {
                // Update in offline storage
                if (this.offlineStorage.exercises && this.offlineStorage.exercises[exerciseId]) {
                    this.offlineStorage.exercises[exerciseId] = {
                        ...this.offlineStorage.exercises[exerciseId],
                        ...exerciseData,
                        updatedAt: new Date().toISOString()
                    };
                    this.saveOfflineData();
                }
                
                // Add to pending sync
                this.pendingSync.push({
                    type: 'updateExercise',
                    data: { id: exerciseId, ...exerciseData }
                });
                
                return { success: true, offline: true };
            }
            
            // If using PostgreSQL
            if (this.dbType === 'postgres') {
                await this.db.query(
                    `UPDATE exercises SET 
                        date = COALESCE($1, date),
                        name = COALESCE($2, name),
                        type = COALESCE($3, type),
                        sets = $4,
                        reps = $5,
                        weight = $6,
                        duration = $7,
                        distance = $8,
                        notes = COALESCE($9, notes),
                        updated_at = NOW()
                    WHERE id = $10 AND user_id = $11`,
                    [
                        exerciseData.date,
                        exerciseData.name,
                        exerciseData.type,
                        exerciseData.sets,
                        exerciseData.reps,
                        exerciseData.weight,
                        exerciseData.duration,
                        exerciseData.distance,
                        exerciseData.notes,
                        exerciseId,
                        this.currentUser.id
                    ]
                );
                
                return { success: true };
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error updating exercise:', error);
            throw error;
        }
    }
    
    // Delete exercise
    async deleteExercise(exerciseId) {
        try {
            // In a real app, this would delete an exercise from the server
            // For demo purposes, we'll use a mock implementation
            
            if (!this.currentUser) {
                throw new Error('User not authenticated');
            }
            
            // If offline or using offline storage
            if (this.offlineMode || !navigator.onLine) {
                // Remove from offline storage
                if (this.offlineStorage.exercises && this.offlineStorage.exercises[exerciseId]) {
                    delete this.offlineStorage.exercises[exerciseId];
                    this.saveOfflineData();
                }
                
                // Add to pending sync
                this.pendingSync.push({
                    type: 'deleteExercise',
                    data: { id: exerciseId }
                });
                
                return { success: true, offline: true };
            }
            
            // If using PostgreSQL
            if (this.dbType === 'postgres') {
                await this.db.query(
                    'DELETE FROM exercises WHERE id = $1 AND user_id = $2',
                    [exerciseId, this.currentUser.id]
                );
                
                return { success: true };
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error deleting exercise:', error);
            throw error;
        }
    }
}

// Export the ExercisesDatabaseService
window.ExercisesDatabaseService = ExercisesDatabaseService;
