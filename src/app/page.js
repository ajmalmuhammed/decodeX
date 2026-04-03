"use client";
import React, { useState, useEffect } from 'react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import GameRoom from '@/components/GameRoom';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGame, setShowGame] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const isAdmin = user?.email === 'muhammed.ajmal@webcardio.com';

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <div className="flicker neon-text" style={{ fontSize: '2rem' }}>INITIALIZING...</div>
      </div>
    );
  }

  if (user && showGame) {
    return (
      <main style={{ minHeight: '100vh', padding: '2rem' }}>
        <GameRoom user={user} />
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ padding: '3rem', maxWidth: '600px', width: '100%', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'var(--primary)', boxShadow: '0 0 15px var(--primary)' }}></div>
        
        <h1 className="neon-text flicker" style={{ fontSize: '4rem', marginBottom: '0.5rem', fontWeight: 800 }}>DECODEX</h1>
        <p className="mono" style={{ marginBottom: '2.5rem', opacity: 0.8, fontSize: '0.9rem', letterSpacing: '0.2rem' }}>// OFFICE_INTELLIGENCE_UNIT</p>

        {!user ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
              Welcome, Agent. To begin the decoding process, please verify your credentials.
            </p>
            <div style={{ marginTop: '1rem' }}>
              <button onClick={handleLogin} style={{ width: '100%', fontSize: '1.1rem' }}>
                [ VERIFY_IDENTITY_VIA_GOOGLE ]
              </button>
            </div>
            <p className="mono" style={{ fontSize: '0.7rem', marginTop: '1rem', opacity: 0.5 }}>
              STATUS: UNAUTHORIZED_ACCESS_DETECTED
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="mono" style={{ background: 'rgba(0,255,65,0.1)', padding: '10px', border: '1px solid var(--primary)', marginBottom: '1rem' }}>
               ACCESS_GRANTED: {user.displayName?.toUpperCase()}
            </div>
            
            <p style={{ fontSize: '1.1rem' }}>
              Connection established. Ready to begin your mission.
            </p>

            <button 
              onClick={() => setShowGame(true)}
              style={{ width: '100%', background: 'var(--primary)', color: 'black' }}
            >
              [ ENTER_DECODING_CHAMBER ]
            </button>

            {isAdmin && (
              <div style={{ marginTop: '1rem' }}>
                <a href="/admin">
                  <button style={{ width: '100%', border: '1px solid var(--secondary)', color: 'var(--secondary)' }}>
                    [ OPEN_ADMIN_CONTROL_PANEL ]
                  </button>
                </a>
              </div>
            )}

            <div style={{ marginTop: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
              <button onClick={handleLogout} style={{ border: '1px solid var(--accent)', color: 'var(--accent)', fontSize: '0.8rem' }}>
                LOGOUT
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mono" style={{ position: 'fixed', bottom: '20px', left: '20px', fontSize: '0.7rem', opacity: 0.4 }}>
        SYSTEM_V.1.0.4<br/>
        ENCRYPTION: AES_256
      </div>
      <div className="mono" style={{ position: 'fixed', bottom: '20px', right: '20px', fontSize: '0.7rem', opacity: 0.4, textAlign: 'right' }}>
        LOC: OFFICE_SERVER_01<br/>
        LAT: 28.6139° N, LON: 77.2090° E
      </div>
    </main>
  );
}
