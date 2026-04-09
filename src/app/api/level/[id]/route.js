import { adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { id } = await params;

  try {
    const docRef = adminDb.collection('levels').doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: 'Level not found' }, { status: 404 });
    }

    const data = snap.data();
    const now = new Date();
    const unlockTime = data.hintUnlockTime ? new Date(data.hintUnlockTime) : null;

    // DIAGNOSTIC LOGS for debugging timezone issues on Vercel
    console.log(`[API_HINT_CHECK] Level: ${id}`);
    console.log(`[API_HINT_CHECK] Server Now: ${now.toISOString()}`);
    console.log(`[API_HINT_CHECK] Unlock Time: ${unlockTime ? unlockTime.toISOString() : 'NONE'}`);
    console.log(`[API_HINT_CHECK] Reveal Condition met: ${!unlockTime || now >= unlockTime}`);

    // Build secure response
    const secureData = {
      id: id,
      image: data.image,
      hintUnlockTime: data.hintUnlockTime,
      answerHash: data.answer 
        ? require('crypto').createHash('sha256').update(data.answer.toLowerCase().trim()).digest('hex') 
        : null,
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
