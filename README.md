# Fitness Tracker

A comprehensive fitness tracking application that helps users monitor workouts, track habits, set goals, and record body measurements.

## Features

- **Dashboard**: Overview of your fitness journey with stats and recent workouts
- **Exercise Tracker**: Log and monitor your exercises with detailed tracking
- **Goals**: Set and track fitness goals with progress visualization
- **Habit Tracker**: Build and maintain healthy habits with a visual tracking matrix
- **Measurements**: Record and visualize body measurements over time

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Containerization**: Docker, Docker Compose
- **Web Server**: Nginx

## Deployment with Portainer

This application is configured for easy deployment using Portainer and Docker Compose.

### Prerequisites

- Portainer installed and running
- PostgreSQL database (or use the included Docker container)
- Docker and Docker Compose

### Deployment Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/max-63452234234/fitness-tracker.git
   cd fitness-tracker
   ```

2. **Configure environment variables**

   Update the `.env` file with your specific configuration:

   ```
   # Database Configuration
   DB_NAME=fitness_tracker
   DB_USER=your_db_user
   DB_PASSWORD=your_secure_password

   # Port Configuration
   SERVER_PORT=3001
   WEB_PORT=80
   ```

   Also update the `server/.env` file with matching database credentials and a secure JWT secret:

   ```
   JWT_SECRET=your_secure_jwt_secret
   DB_PASSWORD=your_secure_password
   ```

3. **Deploy with Portainer**

   - In Portainer, navigate to Stacks
   - Click "Add stack"
   - Name your stack (e.g., "fitness-tracker")
   - Upload the docker-compose.yml file or paste its contents
   - Click "Deploy the stack"

4. **Initialize the Database**

   The first time you run the application, you'll need to initialize the database schema. You can do this by running:

   ```bash
   docker exec -it fitness_tracker_server npm run db:init
   ```

5. **Access the Application**

   Once deployed, access the application at:
   - Frontend: http://your-server-ip
   - API: http://your-server-ip:3001/api

## Development Setup

If you want to run the application locally for development:

1. **Install dependencies**

   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install frontend dependencies (if any)
   cd ..
   npm install
   ```

2. **Configure environment**

   Create a `.env` file in the server directory with your local configuration.

3. **Run the application**

   ```bash
   # Start the server
   cd server
   npm start

   # Serve the frontend (you can use any static file server)
   cd ..
   npx serve .
   ```

## Security Notes

- Change all default passwords in production
- Use a strong JWT secret
- Consider using HTTPS in production
- Regularly update dependencies

## License

MIT License
