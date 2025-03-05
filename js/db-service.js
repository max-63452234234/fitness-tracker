// Database Service for Fitness Tracker
class DatabaseService {
    constructor() {
        this.currentUser = null;
        this.dbType = 'postgres'; // Default to PostgreSQL
        this.offlineStorage = {};
        this.pendingSync = [];
        
        // Initialize database connection based on configuration
        this.initDatabase();
    }
    
    // Initialize database connection
    async initDatabase() {
        try {
            // Load database configuration
            const dbConfig = await this.loadDatabaseConfig();
            this.dbType = dbConfig.type;
            
            console.log(`${this.dbType} configuration loaded`);
            
            // Initialize database connection
            if (this.dbType === 'postgres') {
                // PostgreSQL connection would be initialized here in a real app
                // For demo purposes, we'll use a mock implementation
                this.initPostgresDB(dbConfig);
            } else if (this.dbType === 'firebase') {
                // Firebase connection would be initialized here in a real app
                this.initFirebaseDB(dbConfig);
            } else {
                // Fallback to IndexedDB for offline-only mode
                this.initIndexedDB();
            }
            
            console.log('Database connection initialized');
        } catch (error) {
            console.error('Error initializing database:', error);
            // Fallback to offline mode
            this.initOfflineMode();
        }
    }
    
    // Load database configuration
    async loadDatabaseConfig() {
        try {
            // In a real app, this would load from a config file or environment variables
            // For demo purposes, we'll use a mock configuration
            return {
                type: 'postgres',
                host: '192.168.2.127',
                port: 5432,
                database: 'fitness_tracker',
                user: 'admin',
                password: 'IloveJanu1!'
            };
        } catch (error) {
            console.error('Error loading database configuration:', error);
            return { type: 'offline' };
        }
    }
    
    // Initialize PostgreSQL database
    initPostgresDB(config) {
        // In a real app, this would initialize a PostgreSQL connection
        // For demo purposes, we'll use a mock implementation
        this.db = {
            query: async (sql, params) => {
                // Mock implementation
                console.log('PostgreSQL query:', sql, params);
                
                // If offline, store query for later sync
                if (!navigator.onLine) {
                    this.pendingSync.push({ sql, params });
                    return { offline: true };
                }
                
                // Mock API call to server
                try {
                    const response = await this.mockApiCall(sql, params);
                    return response;
                } catch (error) {
                    console.warn('Falling back to mock implementation');
                    return this.mockQueryResponse(sql, params);
                }
            }
        };
    }
    
    // Initialize Firebase database
    initFirebaseDB(config) {
        // In a real app, this would initialize a Firebase connection
        // For demo purposes, we'll use a mock implementation
        this.db = {
            collection: (name) => {
                return {
                    doc: (id) => {
                        return {
                            get: async () => {
                                // Mock implementation
                                console.log('Firebase get:', name, id);
                                return { exists: true, data: () => ({ id }) };
                            },
                            set: async (data) => {
                                // Mock implementation
                                console.log('Firebase set:', name, id, data);
                                return { id };
                            }
                        };
                    },
                    add: async (data) => {
                        // Mock implementation
                        console.log('Firebase add:', name, data);
                        return { id: 'mock-id' };
                    }
                };
            }
        };
    }
    
    // Initialize IndexedDB for offline mode
    initIndexedDB() {
        // In a real app, this would initialize an IndexedDB connection
        // For demo purposes, we'll use a mock implementation
        console.log('Initializing IndexedDB for offline mode');
        this.offlineMode = true;
    }
    
    // Initialize offline mode
    initOfflineMode() {
        console.log('Initializing offline mode');
        this.offlineMode = true;
        
        // Initialize offline storage
        if (!localStorage.getItem('offlineStorage')) {
            localStorage.setItem('offlineStorage', JSON.stringify({
                users: {},
                workouts: {},
                goals: {},
                measurements: {},
                habits: {},
                habitLogs: {}
            }));
        }
        
        this.offlineStorage = JSON.parse(localStorage.getItem('offlineStorage'));
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
    
    // Save offline data
    saveOfflineData() {
        localStorage.setItem('offlineStorage', JSON.stringify(this.offlineStorage));
    }
    
    // Sync pending workouts
    async syncPendingWorkouts() {
        if (this.pendingSync.length === 0) {
            return { syncedCount: 0 };
        }
        
        const syncCount = this.pendingSync.length;
        
        // In a real app, this would sync pending workouts with the server
        // For demo purposes, we'll just clear the pending sync queue
        this.pendingSync = [];
        
        return { syncedCount: syncCount };
    }
    
    // Check authentication state
    checkAuthState() {
        // In a real app, this would check the authentication state with the server
        // For demo purposes, we'll check localStorage
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            this.currentUser = JSON.parse(storedUser);
            return this.currentUser;
        }
        return null;
    }
    
    // Register a new user
    async registerUser(email, password) {
        try {
            // In a real app, this would register a new user with the server
            // For demo purposes, we'll use a mock implementation
            
            // Check if user already exists
            if (this.offlineStorage.users[email]) {
                throw new Error('User already exists');
            }
            
            // Create new user
            const userId = Math.floor(Math.random() * 1000);
            const user = {
                id: userId,
                email,
                password // In a real app, this would be hashed
            };
            
            // Save user to offline storage
            this.offlineStorage.users[email] = user;
            this.saveOfflineData();
            
            // Set current user
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            return { success: true, user };
        } catch (error) {
            console.error('Error registering user:', error);
            throw error;
        }
    }
    
    // Login user
    async loginUser(email, password) {
        try {
            // In a real app, this would login a user with the server
            // For demo purposes, we'll use a mock implementation
            
            // Check if user exists
            const user = this.offlineStorage.users[email];
            if (!user) {
                // For demo purposes, create a new user if it doesn't exist
                return this.registerUser(email, password);
            }
            
            // Check password
            if (user.password !== password) {
                throw new Error('Invalid password');
            }
            
            // Set current user
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            return { success: true, user };
        } catch (error) {
            console.error('Error logging in user:', error);
            throw error;
        }
    }
    
    // Logout user
    async logoutUser() {
        try {
            // In a real app, this would logout a user with the server
            // For demo purposes, we'll use a mock implementation
            
            // Clear current user
            this.currentUser = null;
            localStorage.removeItem('currentUser');
            
            return { success: true };
        } catch (error) {
            console.error('Error logging out user:', error);
            throw error;
        }
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
    
    // Get habits
    async
