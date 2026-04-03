const admin = require('firebase-admin');
const fs = require('fs');

// To run this, you need a serviceAccountKey.json from your Firebase Console
// Project Settings -> Service Accounts -> Generate new private key
if (!fs.existsSync('./serviceAccountKey.json')) {
  console.log('Error: serviceAccountKey.json not found.');
  console.log('Please download it from Firebase Console and place it in the root folder.');
  process.exit(1);
}

const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const levels = [
  {
    id: 'level_1',
    image: 'https://placehold.co/600x400/000000/00FF41?text=ANSWER_IS_HELLO',
    answer: 'hello',
    hint: 'A common greeting in the digital world.'
  },
  {
    id: 'level_2',
    image: 'https://placehold.co/600x400/000000/00E5FF?text=BINARY_01010111',
    answer: '87',
    hint: 'What is the decimal value of this binary byte?'
  },
  {
    id: 'level_3',
    image: 'https://placehold.co/600x400/000000/FF003C?text=DECODE_ME_IF_YOU_CAN',
    answer: 'hidden',
    hint: 'Look closer at the metadata.'
  }
];

async function seed() {
  console.log('Seeding initial levels...');
  for (const level of levels) {
    await db.collection('levels').doc(level.id).set(level);
    console.log(`Created ${level.id}`);
  }
  console.log('Seeding complete!');
  process.exit(0);
}

seed();
