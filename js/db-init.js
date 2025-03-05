// Initialize the database service as a global variable
if (typeof ExercisesDatabaseService === 'function') {
    // Create a global dbService instance from our most specialized class
    // which includes all functionality through inheritance
    window.dbService = new ExercisesDatabaseService();
    console.log('Database service initialized with all modules');
} else {
    console.error('Database service classes not found! Make sure all database service files are loaded first.');
}
