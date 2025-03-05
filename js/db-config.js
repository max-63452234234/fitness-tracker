// PostgreSQL Database Configuration
const pgConfig = {
  host: window.location.hostname === 'localhost' ? 'localhost' : 'db',
  port: 5432,
  database: 'fitness_tracker',
  user: 'admin',
  password: 'changeme' // This will be overridden by environment variables in production
};

// Check if environment variables are available (when using a proper build process)
if (typeof process !== 'undefined' && process.env) {
  if (process.env.DB_HOST) pgConfig.host = process.env.DB_HOST;
  if (process.env.DB_PORT) pgConfig.port = process.env.DB_PORT;
  if (process.env.DB_NAME) pgConfig.database = process.env.DB_NAME;
  if (process.env.DB_USER) pgConfig.user = process.env.DB_USER;
  if (process.env.DB_PASSWORD) pgConfig.password = process.env.DB_PASSWORD;
}

// Export the configuration
const dbConfig = {
  pg: pgConfig
};

console.log("PostgreSQL configuration loaded");
