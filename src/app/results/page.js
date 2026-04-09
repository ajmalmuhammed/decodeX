"use client";
import React from 'react';
import AuthGuard from '@/components/AuthGuard';
import TournamentBoard from '@/components/TournamentBoard';
import Link from 'next/link';

export default function ResultsPage() {
  return (
    <AuthGuard>
      <main style={{ minHeight: '100vh', padding: 'clamp(1rem, 4vw, 2rem)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="responsive-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
            <div>
              <h1 className="neon-text flicker" style={{ marginBottom: '0.2rem' }}>TOURNAMENT_RESULTS</h1>
              <p className="mono" style={{ fontSize: '0.7rem', opacity: 0.5 }}>// LIVE_FEED_01</p>
            </div>
            <Link href="/">
              <button style={{ fontSize: '0.7rem' }}>[ RETURN_TO_BASE ]</button>
            </Link>
          </div>

          <TournamentBoard />
          
          <div className="mono" style={{ marginTop: '4rem', textAlign: 'center', opacity: 0.3, fontSize: '0.7rem' }}>
            END_OF_TRANSMISSION
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
