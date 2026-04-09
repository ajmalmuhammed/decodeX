"use client";
import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';

export default function AuthGuard({ children, adminOnly = false }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const adminEmails = ['muhammed.ajmal@webcardio.com', 'aysha.s@webcardio.com'];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', background: '#000' }}>
        <div className="flicker neon-text" style={{ fontSize: '2rem' }}>VERIFYING_CREDENTIALS...</div>
      </div>
    );
  }

  const isAuthorized = user && (!adminOnly || adminEmails.includes(user.email?.toLowerCase()));

  if (!isAuthorized) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#000' }}>
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px' }}>
          <h1 className="flicker" style={{ color: 'var(--accent)', fontSize: '2rem', marginBottom: '1.5rem' }}>ACCESS_DENIED</h1>
          <p className="mono" style={{ marginBottom: '2rem' }}>
            {!user ? 'YOU_MUST_BE_AUTHORIZED_TO_VIEW_THIS_INTEL' : 'ONLY_ADMIN_AGENTS_HAVE_LEVEL_4_CLEARANCE'}
          </p>
          <Link href="/">
            <button style={{ width: '100%' }}>[ RETURN_TO_ENTRY_POINT ]</button>
          </Link>
        </div>
      </main>
    );
  }

  // If authorized, clone children and inject user if needed, or just render
  return <>{typeof children === 'function' ? children({ user }) : children}</>;
}
