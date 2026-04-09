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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', background: '#000', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.05, fontSize: '10px', overflow: 'hidden', pointerEvents: 'none', lineHeight: '1', fontFamily: 'monospace' }}>
          {Array(50).fill('0101010101010101010101010101010101010101010101010101010101010101010101010101').map((line, i) => <div key={i}>{line}</div>)}
        </div>
        <div className="flicker neon-text" style={{ fontSize: '1.5rem', letterSpacing: '0.5rem', zIndex: 1 }}>INITIALIZING_IDENTITY...</div>
        <div className="mono" style={{ fontSize: '0.6rem', opacity: 0.4, marginTop: '1rem', zIndex: 1 }}>VERSION 4.2.0 // SECURITY_CHECK</div>
      </div>
    );
  }

  const isAuthorized = user && (!adminOnly || adminEmails.includes(user.email?.toLowerCase()));

  if (!isAuthorized) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#000', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', fontSize: '20vw', fontWeight: '900', color: 'var(--accent)', opacity: 0.03, pointerEvents: 'none', userSelect: 'none', zHeight: 0 }}>403</div>
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px', zIndex: 1, border: '1px solid var(--accent)' }}>
          <h1 className="flicker" style={{ color: 'var(--accent)', fontSize: '2rem', marginBottom: '1rem', letterSpacing: '0.2rem' }}>ACCESS_DENIED</h1>
          <div style={{ height: '2px', background: 'var(--accent)', opacity: 0.3, width: '50px', margin: '0 auto 2rem auto' }}></div>
          <p className="mono" style={{ marginBottom: '2.5rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
            {!user 
              ? 'CRITICAL_ERROR: NO_ACTIVE_SESSION_DETECTED. PLEASE_AUTHENTICATE_AT_THE_MAIN_TERMINAL.' 
              : 'SECURITY_VIOLATION: YOUR_CREDENTIALS_LACK_ADMIN_OVERSIGHT_PERMISSIONS.'}
          </p>
          <Link href="/">
            <button style={{ width: '100%', borderColor: 'var(--accent)', color: 'var(--accent)' }}>[ RETURN_TO_ENTRY_POINT ]</button>
          </Link>
        </div>
      </main>
    );
  }

  // If authorized, clone children and inject user if needed, or just render
  return <>{typeof children === 'function' ? children({ user }) : children}</>;
}
