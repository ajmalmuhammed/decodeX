import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { id } = await params;

  try {
    const levelRef = doc(db, 'levels', id);
    const snap = await getDoc(levelRef);

    if (!snap.exists()) {
      return NextResponse.json({ error: 'Level not found' }, { status: 404 });
    }

    const data = snap.data();
    const now = new Date();
    const unlockTime = data.hintUnlockTime ? new Date(data.hintUnlockTime) : null;

    // Generate SHA-256 hash of the answer for secure client-side check
    const crypto = require('crypto');
    const answerHash = data.answer 
      ? crypto.createHash('sha256').update(data.answer.toLowerCase().trim()).digest('hex') 
      : null;

    // Build secure response
    const secureData = {
      image: data.image,
      hintUnlockTime: data.hintUnlockTime,
      answerHash: answerHash,
      hint: null
    };

    // Only include hint if time has passed
    if (!unlockTime || now >= unlockTime) {
      secureData.hint = data.hint;
    }

    return NextResponse.json(secureData);
  } catch (error) {
    console.error('Secure Level Fetch Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
