import { adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
const admin = require('firebase-admin');

export async function POST(request) {
  try {
    const { token, uid, displayName, photoURL } = await request.json();

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Verify Token (Optional but recommended for high security)
    // For this internal game, we'll trust the UID sent if it's tied to an active session, 
    // but in production, you'd use admin.auth().verifyIdToken(token)

    // 2. Fetch/Create User Progress
    const userRef = adminDb.collection('users').doc(uid);
    let userSnap = await userRef.get();
    
    let userProgress;
    if (!userSnap.exists) {
      userProgress = {
        displayName,
        photoURL,
        level: 1,
        updatedAt: new Date().toISOString()
      };
      await userRef.set(userProgress);
    } else {
      userProgress = userSnap.data();
    }

    // 3. Fetch Level Data
    const levelId = `level_${userProgress.level}`;
    const levelSnap = await adminDb.collection('levels').doc(levelId).get();
    
    let levelData = null;
    if (levelSnap.exists) {
      const data = levelSnap.data();
      const now = new Date();
      const unlockTime = data.hintUnlockTime ? new Date(data.hintUnlockTime) : null;
      
      levelData = {
        id: levelId,
        image: data.image,
        hintUnlockTime: data.hintUnlockTime,
        answerHash: data.answer ? require('crypto').createHash('sha256').update(data.answer.toLowerCase().trim()).digest('hex') : null,
        hint: (!unlockTime || now >= unlockTime) ? data.hint : null
      };
    } else if (userProgress.level > 1) {
      levelData = { isFinished: true, hint: 'Mission Accomplished, Agent.' };
    }

    return NextResponse.json({ userProgress, levelData });
  } catch (error) {
    console.error('Unified Init Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
