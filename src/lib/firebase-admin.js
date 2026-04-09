const admin = require('firebase-admin');

let serviceAccount;
try {
  // Local development fallback
  serviceAccount = require('../../serviceAccountKey.json');
} catch (e) {
  // Vercel / Production environment variables
  // Firebase Admin expects the exact keys from the JSON file
  serviceAccount = {
    project_id: process.env.FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };
}

// Security Check: Only initialize if we have the minimum required data
if (!admin.apps.length && (serviceAccount.project_id || serviceAccount.projectId)) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('Firebase Admin Initialization Error:', error);
  }
}

const adminDb = admin.firestore();

module.exports = { adminDb };
