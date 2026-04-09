"use client";
import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import GameRoom from '@/components/GameRoom';
import MissionBriefing from '@/components/MissionBriefing';
import Link from 'next/link';

export default function GamePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <div className="flicker neon-text" style={{ fontSize: '2rem' }}>VERIFYING_CREDENTIALS...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px' }}>
          <h1 className="flicker" style={{ color: 'var(--accent)', fontSize: '2rem', marginBottom: '1.5rem' }}>ACCESS_DENIED</h1>
          <p className="mono" style={{ marginBottom: '2rem' }}>YOU_MUST_BE_AUTHORIZED_TO_ENTER_THE_CHAMBER</p>
          <Link href="/">
            <button style={{ width: '100%' }}>[ RETURN_TO_ENTRY_POINT ]</button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: 'clamp(1rem, 5vw, 2rem)' }}>
      
      <MissionBriefing isOpen={isBriefingOpen} onClose={() => setIsBriefingOpen(false)} />

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="responsive-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
          <div>
            <h1 className="neon-text flicker" style={{ fontSize: '1.5rem' }}>DECODING_CHAMBER</h1>
            <p className="mono" style={{ fontSize: '0.7rem', opacity: 0.5 }}>// SECURE_ZONE_01</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => setIsBriefingOpen(true)} style={{ fontSize: '0.7rem', padding: '8px 12px', borderColor: 'var(--secondary)', color: 'var(--secondary)' }}>[ RULES ]</button>
            <Link href="/">
              <button style={{ fontSize: '0.7rem', padding: '8px 12px' }}>[ HOME ]</button>
            </Link>
          </div>
        </div>

        <GameRoom user={user} />
      </div>
    </main>
  );
}
