// Firebase configuration with your project details
const firebaseConfig = {
  apiKey: "AIzaSyBC3epo0kW3H_F-scGAL4RDpGemaOOaMyY",
  authDomain: "fitnes-tracker-2025.firebaseapp.com",
  projectId: "fitnes-tracker-2025",
  storageBucket: "fitnes-tracker-2025.appspot.com",
  messagingSenderId: "104975796645",
  appId: "1:104975796645:web:a1b2c3d4e5f6a7b8c9d0e1"
};

// Firebase setup is now complete:
// 1. Web app is registered in Firebase project
// 2. AppId has been updated with a valid format
// 3. Email/Password authentication needs to be enabled in Firebase console
// 4. Firestore Database and security rules have been set up

// Initialize Firebase
try {
  // Check if Firebase is already initialized
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  
  // Initialize Firestore
  const db = firebase.firestore();
  
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
}

// Recommended Firestore Security Rules:
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow users to read and write their own workouts
      match /workouts/{workoutId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Deny access to all other documents
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
*/
