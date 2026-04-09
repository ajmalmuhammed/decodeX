"use client";
import React, { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import GameRoom from '@/components/GameRoom';
import MissionBriefing from '@/components/MissionBriefing';
import Link from 'next/link';

export default function GamePage() {
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);

  return (
    <AuthGuard>
      {({ user }) => (
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
      )}
    </AuthGuard>
  );
}
