// Goals Service for Fitness Tracker
// This file contains goal data management functionality

// Extend the WorkoutsDatabaseService class
class GoalsDatabaseService extends WorkoutsDatabaseService {
    constructor() {
        super();
    }
    
    // Get goals
    async getGoals() {
        try {
            // In a real app, this would get goals from the server
            // For demo purposes, we'll use a mock implementation
            
            if (!this.currentUser) {
                throw new Error('User not authenticated');
            }
            
            // If using PostgreSQL
            if (this.dbType === 'postgres') {
                const result = await this.db.query(
                    'SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC',
                    [this.currentUser.id]
                );
                
                // If offline, return mock data
                if (result.offline) {
                    return Object.values(this.offlineStorage.goals || {})
                        .filter(g => g.userId === this.currentUser.id)
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                }
                
                // Format goals
                return result.rows.map(row => ({
                    id: row.id,
                    title: row.title,
                    description: row.description,
                    targetValue: row.target_value,
                    currentValue: row.current_value,
                    unit: row.unit,
                    category: row.category,
                    startDate: row.start_date,
                    targetDate: row.target_date,
                    completed: row.completed
                }));
            }
            
            // If offline mode
            return Object.values(this.offlineStorage.goals || {})
                .filter(g => g.userId === this.currentUser.id)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch (error) {
            console.error('Error getting goals:', error);
            throw error;
        }
    }
    
    // Add goal
    async addGoal(goalData) {
        try {
            // In a real app, this would add a goal to the server
            // For demo purposes, we'll use a mock implementation
            
            if (!this.currentUser) {
                throw new Error('User not authenticated');
            }
            
            const goal = {
                ...goalData,
                userId: this.currentUser.id,
                createdAt: new Date().toISOString()
            };
            
            // If offline or using offline storage
            if (this.offlineMode || !navigator.onLine) {
                const goalId = Math.floor(Math.random() * 1000);
                goal.id = goalId;
                
                // Save to offline storage
                if (!this.offlineStorage.goals) {
                    this.offlineStorage.goals = {};
                }
                this.offlineStorage.goals[goalId] = goal;
                this.saveOfflineData();
                
                // Add to pending sync
                this.pendingSync.push({
                    type: 'addGoal',
                    data: goal
                });
                
                return { id: goalId, offline: true };
            }
            
            // If using PostgreSQL
            if (this.dbType === 'postgres') {
                const result = await this.db.query(
                    `INSERT INTO goals (
                        user_id, title, description, target_value, current_value, 
                        unit, category, start_date, target_date, completed
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
                    [
                        this.currentUser.id,
                        goal.title,
                        goal.description,
                        goal.targetValue,
                        goal.currentValue,
                        goal.unit,
                        goal.category,
                        goal.startDate,
                        goal.targetDate,
                        goal.completed || false
                    ]
                );
                
                return { id: result.rows[0].id };
            }
            
            return { id: Math.floor(Math.random() * 1000) };
        } catch (error) {
            console.error('Error adding goal:', error);
            throw error;
        }
    }
    
    // Update goal
    async updateGoal(goalId, goalData) {
        try {
            // In a real app, this would update a goal on the server
            // For demo purposes, we'll use a mock implementation
            
            if (!this.currentUser) {
                throw new Error('User not authenticated');
            }
            
            // If offline or using offline storage
            if (this.offlineMode || !navigator.onLine) {
                // Update in offline storage
                if (this.offlineStorage.goals && this.offlineStorage.goals[goalId]) {
                    this.offlineStorage.goals[goalId] = {
                        ...this.offlineStorage.goals[goalId],
                        ...goalData,
                        updatedAt: new Date().toISOString()
                    };
                    this.saveOfflineData();
                }
                
                // Add to pending sync
                this.pendingSync.push({
                    type: 'updateGoal',
                    data: { id: goalId, ...goalData }
                });
                
                return { success: true, offline: true };
            }
            
            // If using PostgreSQL
            if (this.dbType === 'postgres') {
                await this.db.query(
                    `UPDATE goals SET 
                        title = COALESCE($1, title),
                        description = COALESCE($2, description),
                        target_value = COALESCE($3, target_value),
                        current_value = COALESCE($4, current_value),
                        unit = COALESCE($5, unit),
                        category = COALESCE($6, category),
                        start_date = COALESCE($7, start_date),
                        target_date = COALESCE($8, target_date),
                        completed = COALESCE($9, completed)
                    WHERE id = $10 AND user_id = $11`,
                    [
                        goalData.title,
                        goalData.description,
                        goalData.targetValue,
                        goalData.currentValue,
                        goalData.unit,
                        goalData.category,
                        goalData.startDate,
                        goalData.targetDate,
                        goalData.completed,
                        goalId,
                        this.currentUser.id
                    ]
                );
                
                return { success: true };
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error updating goal:', error);
            throw error;
        }
    }
    
    // Delete goal
    async deleteGoal(goalId) {
        try {
            // In a real app, this would delete a goal from the server
            // For demo purposes, we'll use a mock implementation
            
            if (!this.currentUser) {
                throw new Error('User not authenticated');
            }
            
            // If offline or using offline storage
            if (this.offlineMode || !navigator.onLine) {
                // Remove from offline storage
                if (this.offlineStorage.goals && this.offlineStorage.goals[goalId]) {
                    delete this.offlineStorage.goals[goalId];
                    this.saveOfflineData();
                }
                
                // Add to pending sync
                this.pendingSync.push({
                    type: 'deleteGoal',
                    data: { id: goalId }
                });
                
                return { success: true, offline: true };
            }
            
            // If using PostgreSQL
            if (this.dbType === 'postgres') {
                await this.db.query(
                    'DELETE FROM goals WHERE id = $1 AND user_id = $2',
                    [goalId, this.currentUser.id]
                );
                
                return { success: true };
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error deleting goal:', error);
            throw error;
        }
    }
}

// Export the GoalsDatabaseService
window.GoalsDatabaseService = GoalsDatabaseService;
