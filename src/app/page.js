"use client";
import React, { useState, useEffect } from 'react';
import { auth, googleProvider, db } from '@/lib/firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';
import MissionBriefing from '@/components/MissionBriefing';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('level', 'desc'), orderBy('updatedAt', 'asc'), limit(15));
    const unsubscribe = onSnapshot(q, (snap) => {
      const board = [];
      snap.forEach(doc => {
        const data = doc.data();
        if (!data.isAdmin) {
          board.push({ id: doc.id, ...data });
        }
      });
      setLeaderboard(board.slice(0, 10));
    });

    const authUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        initializeUser(currentUser);
      }
    });
    return () => {
      unsubscribe();
      authUnsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await initializeUser(result.user);
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const initializeUser = async (currentUser) => {
    try {
      const token = await currentUser.getIdToken();
      await fetch('/api/game-init', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': currentUser.email || '' 
        },
        body: JSON.stringify({
          token,
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL
        })
      });
    } catch (err) {
      console.error("Early Init Error:", err);
    }
  };

  const handleLogout = () => signOut(auth);

  const isAdmin = ['muhammed.ajmal@webcardio.com', 'aysha.s@webcardio.com'].includes(user?.email?.toLowerCase());

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <div className="flicker neon-text" style={{ fontSize: '2rem' }}>INITIALIZING...</div>
      </div>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      
      <MissionBriefing isOpen={isBriefingOpen} onClose={() => setIsBriefingOpen(false)} />

      <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'var(--primary)', boxShadow: '0 0 15px var(--primary)' }}></div>
        
        <h1 className="neon-text flicker" style={{ marginBottom: '0.5rem', fontWeight: 800 }}>DECODEX</h1>
        <p className="mono" style={{ marginBottom: '2.5rem', opacity: 0.8, fontSize: 'clamp(0.6rem, 2vw, 0.9rem)', letterSpacing: '0.2rem' }}>// WEBCARDIO_INTEL_UNIT</p>

        {!user ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <p className="mono" style={{ fontSize: 'clamp(0.8rem, 3vw, 1.1rem)', lineHeight: '1.6', opacity: 0.9 }}>
              Welcome, Agent. Verify your credentials to enter the decoding chamber.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                onClick={handleLogin} 
                style={{ width: '100%', fontSize: 'clamp(0.6rem, 3.3vw, 0.9rem)', letterSpacing: '-0.02em', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              >
                [ VERIFY_IDENTITY_VIA_GOOGLE ]
              </button>
              <button 
                onClick={() => setIsBriefingOpen(true)} 
                style={{ width: '100%', borderColor: 'var(--secondary)', color: 'var(--secondary)', fontSize: 'clamp(0.6rem, 3.3vw, 0.9rem)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              >
                [ VIEW_RULES ]
              </button>
              <Link href="/results" style={{ width: '100%' }}>
                <button style={{ width: '100%', borderColor: 'var(--secondary)', color: 'var(--secondary)', fontSize: 'clamp(0.6rem, 3.3vw, 0.9rem)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  [ VIEW_TOURNAMENT_RESULTS ]
                </button>
              </Link>
            </div>
            <p className="mono" style={{ fontSize: '0.7rem', marginTop: '1rem', opacity: 0.5 }}>
              STATUS: UNAUTHORIZED_ACCESS_DETECTED
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="mono" style={{ 
              background: 'rgba(0,255,65,0.1)', 
              padding: '12px', 
              border: '1px solid var(--primary)', 
              marginBottom: '1rem',
              fontSize: 'clamp(0.7rem, 3vw, 0.9rem)',
              wordBreak: 'break-all'
            }}>
               ACCESS_GRANTED: {user.displayName?.toUpperCase()}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Link href="/game" style={{ width: '100%', display: 'block' }}>
                <button style={{ width: '100%', background: 'var(--primary)', color: 'black' }}>
                  [ ENTER_DECODING_CHAMBER ]
                </button>
              </Link>

              <button onClick={() => setIsBriefingOpen(true)} style={{ width: '100%', borderColor: 'var(--secondary)', color: 'var(--secondary)' }}>
                [ VIEW_RULES ]
              </button>

              <Link href="/results" style={{ width: '100%', display: 'block' }}>
                <button style={{ width: '100%', borderColor: 'var(--secondary)', color: 'var(--secondary)' }}>
                  [ VIEW_TOURNAMENT_RESULTS ]
                </button>
              </Link>

              {isAdmin && (
                <Link href="/admin" style={{ width: '100%', display: 'block' }}>
                  <button style={{ width: '100%', borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                    [ OPEN_ADMIN_CONTROL_PANEL ]
                  </button>
                </Link>
              )}
            </div>

            <div style={{ marginTop: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
              <button onClick={handleLogout} style={{ border: '1px solid var(--accent)', color: 'var(--accent)', fontSize: '0.8rem' }}>
                LOGOUT
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mono" style={{ position: 'fixed', bottom: '20px', left: '20px', fontSize: '0.7rem', opacity: 0.4, display: 'var(--footer-display, block)' }}>
        SYSTEM_V.1.0.5<br/>
        ENCRYPTION: AES_256
      </div>
      <div className="mono" style={{ position: 'fixed', bottom: '20px', right: '20px', fontSize: '0.7rem', opacity: 0.4, textAlign: 'right', display: 'var(--footer-display, block)' }}>
        LOC: OFFICE_SERVER_01<br/>
        LAT: 28.6139° N, LON: 77.2090° E
      </div>
    </main>
  );
}
