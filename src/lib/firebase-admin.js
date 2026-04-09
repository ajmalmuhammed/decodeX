const admin = require('firebase-admin');

let serviceAccount;
try {
  // 1. Try to load local JSON file
  serviceAccount = require('../../serviceAccountKey.json');
} catch (e) {
  // 2. Fallback to Environment Variables
  // We trim and clean the private key to prevent common Vercel formatting errors
  const rawKey = process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY;
  const privateKey = rawKey ? rawKey.replace(/\\n/g, '\n').replace(/^"(.*)"$/, '$1') : undefined;

  serviceAccount = {
    project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_CLIENT_EMAIL || process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
    private_key: privateKey,
  };
}

if (admin.apps.length === 0) {
  // Debug check (won't show sensitive data, just presence)
  if (!serviceAccount.project_id) console.error("❌ ADMIN_AUTH: Missing Project ID");
  if (!serviceAccount.client_email) console.error("❌ ADMIN_AUTH: Missing Client Email");
  if (!serviceAccount.private_key) console.error("❌ ADMIN_AUTH: Missing Private Key");

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("✅ Firebase Admin Initialized.");
  } catch (error) {
    console.error('❌ Firebase Admin Initialization Error:', error);
  }
}

const adminDb = admin.firestore();
module.exports = { adminDb };
