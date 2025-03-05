// Habits Service for Fitness Tracker
// This file contains habit data management functionality

// Extend the MeasurementsDatabaseService class
class HabitsDatabaseService extends MeasurementsDatabaseService {
    constructor() {
        super();
    }
    
    // Get habits
    async getHabits() {
        try {
            // In a real app, this would get habits from the server
            // For demo purposes, we'll use a mock implementation
            
            if (!this.currentUser) {
                throw new Error('User not authenticated');
            }
            
            // If using PostgreSQL
            if (this.dbType === 'postgres') {
                const result = await this.db.query(
                    'SELECT * FROM habits WHERE user_id = $1 ORDER BY created_at DESC',
                    [this.currentUser.id]
                );
                
                // If offline, return mock data
                if (result.offline) {
                    return Object.values(this.offlineStorage.habits || {})
                        .filter(h => h.userId === this.currentUser.id)
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                }
                
                // Format habits
                return result.rows.map(row => ({
                    id: row.id,
                    name: row.name,
                    description: row.description,
                    frequency: row.frequency,
                    createdAt: row.created_at
                }));
            }
            
            // If offline mode
            return Object.values(this.offlineStorage.habits || {})
                .filter(h => h.userId === this.currentUser.id)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch (error) {
            console.error('Error getting habits:', error);
            throw error;
        }
    }
    
    // Add habit
    async addHabit(habitData) {
        try {
            // In a real app, this would add a habit to the server
            // For demo purposes, we'll use a mock implementation
            
            if (!this.currentUser) {
                throw new Error('User not authenticated');
            }
            
            const habit = {
                ...habitData,
                userId: this.currentUser.id,
                createdAt: new Date().toISOString()
            };
            
            // If offline or using offline storage
            if (this.offlineMode || !navigator.onLine) {
                const habitId = Math.floor(Math.random() * 1000);
                habit.id = habitId;
                
                // Save to offline storage
                if (!this.offlineStorage.habits) {
                    this.offlineStorage.habits = {};
                }
                this.offlineStorage.habits[habitId] = habit;
                this.saveOfflineData();
                
                // Add to pending sync
                this.pendingSync.push({
                    type: 'addHabit',
                    data: habit
                });
                
                return { id: habitId, offline: true };
            }
            
            // If using PostgreSQL
            if (this.dbType === 'postgres') {
                const result = await this.db.query(
                    `INSERT INTO habits (user_id, name, description, frequency) 
                     VALUES ($1, $2, $3, $4) RETURNING id`,
                    [
                        this.currentUser.id,
                        habit.name,
                        habit.description,
                        habit.frequency
                    ]
                );
                
                return { id: result.rows[0].id };
            }
            
            return { id: Math.floor(Math.random() * 1000) };
        } catch (error) {
            console.error('Error adding habit:', error);
            throw error;
        }
    }
    
    // Delete habit
    async deleteHabit(habitId) {
        try {
            // In a real app, this would delete a habit from the server
            // For demo purposes, we'll use a mock implementation
            
            if (!this.currentUser) {
                throw new Error('User not authenticated');
            }
            
            // If offline or using offline storage
            if (this.offlineMode || !navigator.onLine) {
                // Remove from offline storage
                if (this.offlineStorage.habits && this.offlineStorage.habits[habitId]) {
                    delete this.offlineStorage.habits[habitId];
                    
                    // Also delete associated habit logs
                    if (this.offlineStorage.habitLogs) {
                        Object.keys(this.offlineStorage.habitLogs).forEach(logId => {
                            if (this.offlineStorage.habitLogs[logId].habitId === habitId) {
                                delete this.offlineStorage.habitLogs[logId];
                            }
                        });
                    }
                    
                    this.saveOfflineData();
                }
                
                // Add to pending sync
                this.pendingSync.push({
                    type: 'deleteHabit',
                    data: { id: habitId }
                });
                
                return { success: true, offline: true };
            }
            
            // If using PostgreSQL
            if (this.dbType === 'postgres') {
                // Delete habit logs first
                await this.db.query(
                    'DELETE FROM habit_logs WHERE habit_id IN (SELECT id FROM habits WHERE id = $1 AND user_id = $2)',
                    [habitId, this.currentUser.id]
                );
                
                // Then delete the habit
                await this.db.query(
                    'DELETE FROM habits WHERE id = $1 AND user_id = $2',
                    [habitId, this.currentUser.id]
                );
                
                return { success: true };
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error deleting habit:', error);
            throw error;
        }
    }
    
    // Get habit logs
    async getHabitLogs(habitId, startDate, endDate) {
        try {
            // In a real app, this would get habit logs from the server
            // For demo purposes, we'll use a mock implementation
            
            if (!this.currentUser) {
                throw new Error('User not authenticated');
            }
            
            // If using PostgreSQL
            if (this.dbType === 'postgres') {
                const result = await this.db.query(
                    `SELECT * FROM habit_logs 
                     WHERE habit_id = $1 
                     AND date >= $2 
                     AND date <= $3 
                     ORDER BY date ASC`,
                    [habitId, startDate, endDate]
                );
                
                // If offline, return mock data
                if (result.offline) {
                    return Object.values(this.offlineStorage.habitLogs || {})
                        .filter(log => 
                            log.habitId === habitId && 
                            log.date >= startDate && 
                            log.date <= endDate
                        )
                        .sort((a, b) => new Date(a.date) - new Date(b.date));
                }
                
                // Format habit logs
                return result.rows.map(row => ({
                    id: row.id,
                    habitId: row.habit_id,
                    date: row.date,
                    completed: row.completed,
                    notes: row.notes
                }));
            }
            
            // If offline mode
            return Object.values(this.offlineStorage.habitLogs || {})
                .filter(log => 
                    log.habitId === habitId && 
                    log.date >= startDate && 
                    log.date <= endDate
                )
                .sort((a, b) => new Date(a.date) - new Date(b.date));
        } catch (error) {
            console.error('Error getting habit logs:', error);
            throw error;
        }
    }
    
    // Update habit log
    async updateHabitLog(habitId, date, completed, notes = '') {
        try {
            // In a real app, this would update a habit log on the server
            // For demo purposes, we'll use a mock implementation
            
            if (!this.currentUser) {
                throw new Error('User not authenticated');
            }
            
            const logData = {
                habitId,
                date,
                completed,
                notes,
                updatedAt: new Date().toISOString()
            };
            
            // If offline or using offline storage
            if (this.offlineMode || !navigator.onLine) {
                // Check if log exists
                let existingLogId = null;
                
                if (this.offlineStorage.habitLogs) {
                    Object.keys(this.offlineStorage.habitLogs).forEach(logId => {
                        const log = this.offlineStorage.habitLogs[logId];
                        if (log.habitId === habitId && log.date === date) {
                            existingLogId = logId;
                        }
                    });
                }
                
                if (existingLogId) {
                    // Update existing log
                    this.offlineStorage.habitLogs[existingLogId] = {
                        ...this.offlineStorage.habitLogs[existingLogId],
                        ...logData
                    };
                } else {
                    // Create new log
                    const logId = Math.floor(Math.random() * 1000);
                    
                    if (!this.offlineStorage.habitLogs) {
                        this.offlineStorage.habitLogs = {};
                    }
                    
                    this.offlineStorage.habitLogs[logId] = {
                        id: logId,
                        ...logData,
                        createdAt: new Date().toISOString()
                    };
                }
                
                this.saveOfflineData();
                
                // Add to pending sync
                this.pendingSync.push({
                    type: 'updateHabitLog',
                    data: logData
                });
                
                return { success: true, offline: true };
            }
            
            // If using PostgreSQL
            if (this.dbType === 'postgres') {
                // Check if log exists
                const checkResult = await this.db.query(
                    `SELECT id FROM habit_logs 
                     WHERE habit_id = $1 AND date = $2`,
                    [habitId, date]
                );
                
                if (checkResult.rows.length > 0) {
                    // Update existing log
                    await this.db.query(
                        `UPDATE habit_logs 
                         SET completed = $1, notes = $2, updated_at = NOW() 
                         WHERE habit_id = $3 AND date = $4`,
                        [completed, notes, habitId, date]
                    );
                } else {
                    // Create new log
                    await this.db.query(
                        `INSERT INTO habit_logs (habit_id, date, completed, notes) 
                         VALUES ($1, $2, $3, $4)`,
                        [habitId, date, completed, notes]
                    );
                }
                
                return { success: true };
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error updating habit log:', error);
            throw error;
        }
    }
}

// Export the HabitsDatabaseService
window.HabitsDatabaseService = HabitsDatabaseService;
