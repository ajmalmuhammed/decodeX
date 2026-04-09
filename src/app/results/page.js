"use client";
import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import TournamentBoard from '@/components/TournamentBoard';
import Link from 'next/link';

export default function ResultsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
          <p className="mono" style={{ marginBottom: '2rem' }}>PLEASE_LOGIN_TO_VIEW_TOURNAMENT_RESULTS</p>
          <Link href="/">
            <button style={{ width: '100%' }}>[ GO_TO_LOGIN ]</button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="responsive-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
          <div>
            <h1 className="neon-text flicker" style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>TOURNAMENT_RESULTS</h1>
            <p className="mono" style={{ fontSize: '0.7rem', opacity: 0.5 }}>// LIVE_FEED_01</p>
          </div>
          <Link href="/">
            <button style={{ fontSize: '0.8rem' }}>[ RETURN_TO_BASE ]</button>
          </Link>
        </div>

        <TournamentBoard />
        
        <div className="mono" style={{ marginTop: '4rem', textAlign: 'center', opacity: 0.3, fontSize: '0.7rem' }}>
          END_OF_TRANSMISSION
        </div>
      </div>
    </main>
  );
}
