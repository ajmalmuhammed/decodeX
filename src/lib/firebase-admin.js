const admin = require('firebase-admin');

let serviceAccount;
try {
  // 1. Try to load local JSON file
  serviceAccount = require('../../serviceAccountKey.json');
} catch (e) {
  // 2. Fallback to Environment Variables (supports both standard and NEXT_PUBLIC prefixes)
  serviceAccount = {
    project_id: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_CLIENT_EMAIL || process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
    private_key: (process.env.FIREBASE_PRIVATE_KEY || process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, '\n'),
  };
}

// Ensure the app is initialized exactly once
if (admin.apps.length === 0) {
  if (!serviceAccount.project_id) {
    console.error("FATAL: Firebase PROJECT_ID is missing from Env Variables. Check your Vercel Settings.");
  }
  
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin Initialized successfully.");
  } catch (error) {
    console.error('Firebase Admin Initialization Error:', error);
  }
}

const adminDb = admin.firestore();
module.exports = { adminDb };
