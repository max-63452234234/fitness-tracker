// Mock data implementation for Database Service
// This file contains mock API and query response functionality

// Extend the base DatabaseService class
class MockDatabaseService extends DatabaseService {
    constructor() {
        super();
    }
    
    // Mock API call to server
    async mockApiCall(sql, params) {
        // In a real app, this would make an API call to the server
        // For demo purposes, we'll simulate a network request
        
        // Simulate API error if offline
        if (!navigator.onLine) {
            throw new Error('Network error');
        }
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Simulate API response
        return this.mockQueryResponse(sql, params);
    }
    
    // Mock query response
    mockQueryResponse(sql, params) {
        // Generate mock response based on SQL query
        if (sql.includes('SELECT') && sql.includes('workouts')) {
            return {
                rows: [
                    {
                        id: 1,
                        user_id: this.currentUser?.id || 1,
                        date: '2023-01-01',
                        type: 'running',
                        duration: 30,
                        intensity: 'medium',
                        notes: 'Morning run',
                        created_at: '2023-01-01T08:00:00Z'
                    },
                    {
                        id: 2,
                        user_id: this.currentUser?.id || 1,
                        date: '2023-01-03',
                        type: 'strength',
                        duration: 45,
                        intensity: 'high',
                        notes: 'Upper body workout',
                        created_at: '2023-01-03T18:00:00Z'
                    }
                ]
            };
        } else if (sql.includes('INSERT') || sql.includes('UPDATE') || sql.includes('DELETE')) {
            return {
                rowCount: 1,
                rows: [{ id: Math.floor(Math.random() * 1000) }]
            };
        } else if (sql.includes('SELECT') && sql.includes('goals')) {
            return {
                rows: [
                    {
                        id: 1,
                        user_id: this.currentUser?.id || 1,
                        title: 'Run 5K',
                        description: 'Complete a 5K run',
                        target_value: 5,
                        current_value: 3.2,
                        unit: 'km',
                        category: 'endurance',
                        start_date: '2023-01-01',
                        target_date: '2023-03-01',
                        completed: false,
                        created_at: '2023-01-01T08:00:00Z'
                    }
                ]
            };
        } else if (sql.includes('SELECT') && sql.includes('measurements')) {
            return {
                rows: [
                    {
                        id: 1,
                        user_id: this.currentUser?.id || 1,
                        date: '2023-01-01',
                        weight: 75.5,
                        height: 180,
                        body_fat: 15.2,
                        chest: 95,
                        waist: 80,
                        hips: 90,
                        arms: 35,
                        thighs: 55,
                        notes: 'Morning measurement',
                        created_at: '2023-01-01T08:00:00Z'
                    }
                ]
            };
        } else if (sql.includes('SELECT') && sql.includes('habits')) {
            return {
                rows: [
                    {
                        id: 1,
                        user_id: this.currentUser?.id || 1,
                        name: 'Morning Run',
                        description: 'Run for 30 minutes every morning',
                        frequency: 'daily',
                        created_at: '2023-01-01T08:00:00Z'
                    },
                    {
                        id: 2,
                        user_id: this.currentUser?.id || 1,
                        name: 'Drink Water',
                        description: 'Drink 8 glasses of water',
                        frequency: 'daily',
                        created_at: '2023-01-01T08:00:00Z'
                    }
                ]
            };
        } else if (sql.includes('SELECT') && sql.includes('habit_logs')) {
            return {
                rows: [
                    {
                        id: 1,
                        habit_id: 1,
                        date: '2023-01-01',
                        completed: true,
                        notes: 'Completed morning run',
                        created_at: '2023-01-01T08:00:00Z'
                    },
                    {
                        id: 2,
                        habit_id: 1,
                        date: '2023-01-02',
                        completed: true,
                        notes: 'Completed morning run',
                        created_at: '2023-01-02T08:00:00Z'
                    },
                    {
                        id: 3,
                        habit_id: 1,
                        date: '2023-01-03',
                        completed: false,
                        notes: 'Skipped due to rain',
                        created_at: '2023-01-03T08:00:00Z'
                    }
                ]
            };
        } else {
            return { rows: [] };
        }
    }
}

// Export the MockDatabaseService as a mixin
window.MockDatabaseService = MockDatabaseService;
