const admin = require('firebase-admin');

let serviceAccount;
try {
  // Local development fallback
  serviceAccount = require('../../serviceAccountKey.json');
} catch (e) {
  // Vercel / Production environment variables
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Note: The replace handles the way Vercel stores newline characters in private keys
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };
}

if (!admin.apps.length) {
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
