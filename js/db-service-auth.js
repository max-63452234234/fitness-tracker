// Authentication Service for Fitness Tracker
// This file contains user authentication functionality

// Extend the MockDatabaseService class
class AuthDatabaseService extends MockDatabaseService {
    constructor() {
        super();
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
            if (this.offlineStorage && this.offlineStorage.users && this.offlineStorage.users[email]) {
                throw new Error('User already exists');
            }
            
            // Ensure users object exists
            if (!this.offlineStorage) {
                this.offlineStorage = {};
            }
            if (!this.offlineStorage.users) {
                this.offlineStorage.users = {};
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
            const user = this.offlineStorage && this.offlineStorage.users ? this.offlineStorage.users[email] : null;
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
}

// Export the AuthDatabaseService
window.AuthDatabaseService = AuthDatabaseService;
