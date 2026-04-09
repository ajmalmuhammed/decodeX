"use client";
import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, collection, query, orderBy, limit, onSnapshot, increment } from 'firebase/firestore';

export default function GameRoom({ user }) {
  const [levelData, setLevelData] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [gameConfig, setGameConfig] = useState({ gameStatus: 'active', unlockedLevel: 99 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [debugHintOverride, setDebugHintOverride] = useState(false);
  
  const fetchInProgress = useRef(false);
  const isAdmin = ['muhammed.ajmal@webcardio.com', 'aysha.s@webcardio.com'].includes(user?.email?.toLowerCase());

  // --- UNIFIED INITIALIZATION (The "Single Call") ---
  const initializeGame = async () => {
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;
    setLoading(true);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/game-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL
        })
      });

      if (response.ok) {
        const { userProgress: progress, levelData: level } = await response.json();
        setUserProgress(progress);
        setLevelData(level);
      } else {
        setStatus('ERROR: UNIFIED_INIT_FAILURE');
      }
    } catch (err) {
      console.error("Init Error:", err);
      setStatus('OFFLINE: RECONNECTING...');
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  };

  useEffect(() => {
    if (user) initializeGame();
  }, [user.uid]);

  // Subsequent fetch for just level data (e.g. after answering or hint reveal)
  const fetchLevel = async (levelNum) => {
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;
    setIsFetching(true);

    try {
      const response = await fetch(`/api/level/level_${levelNum}`);
      if (response.ok) {
        const data = await response.json();
        setLevelData(data);
      }
    } catch (err) { console.error(err); } 
    finally {
      setIsFetching(false);
      fetchInProgress.current = false;
    }
  };

  // --- PRECISION HINT TRIGGER (Fix for Vercel Infinite Loop) ---
  useEffect(() => {
    // We only set a timer if we have a locked hint
    if (levelData?.hintUnlockTime && !levelData.hint && !levelData.isFinished) {
      const unlockTime = new Date(levelData.hintUnlockTime);
      const now = new Date();
      const timeDiff = unlockTime - now;

      // If time has already passed, trigger exactly once
      if (timeDiff <= 0) {
        console.log("🔓 HINT_THRESHOLD_REACHED (ONE-TIME TRIGGER)");
        fetchLevel(userProgress.level);
      } else {
        // Otherwise, set a precision timeout for the future
        console.log(`⏲️ HINT_TIMER_SET: ${Math.round(timeDiff/1000)}s`);
        const timer = setTimeout(() => {
          fetchLevel(userProgress.level);
        }, timeDiff + 1000); // 1s buffer to ensure server clock has passed the mark

        return () => clearTimeout(timer);
      }
    }
  }, [levelData?.id, levelData?.hint]); // NO LONGER DEPENDS ON currentTime

  // Real-time Leaderboard & Config
  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('level', 'desc'), orderBy('updatedAt', 'asc'), limit(10));
    const unsubscribe = onSnapshot(q, (snap) => {
      const board = [];
      snap.forEach(doc => board.push({ id: doc.id, ...doc.data() }));
      setLeaderboard(board);
    }, (error) => {
      if (error.code === 'failed-precondition') {
        onSnapshot(query(collection(db, 'users'), orderBy('level', 'desc'), limit(10)), (snap) => {
          const board = [];
          snap.forEach(doc => board.push({ id: doc.id, ...doc.data() }));
          setLeaderboard(board);
        });
      }
    });

    const unsubscribeConfig = onSnapshot(doc(db, 'metadata', 'gameConfig'), (snap) => {
      if (snap.exists()) setGameConfig(snap.data());
    });

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => { unsubscribe(); unsubscribeConfig(); clearInterval(timer); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!answer || isFetching) return;
    setStatus('VALIDATING...');
    try {
      const inputHash = await hashString(answer);
      if (inputHash === levelData?.answerHash) {
        setStatus('SUCCESS!');
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { level: increment(1), updatedAt: new Date().toISOString() });
        setUserProgress(prev => ({ ...prev, level: prev.level + 1 }));
        setAnswer('');
        fetchLevel(userProgress.level + 1);
      } else {
        setStatus('ERROR: INCORRECT');
        setTimeout(() => setStatus(''), 2000);
      }
    } catch (err) { setStatus('SYSTEM_ERROR'); }
  };

  const hashString = async (string) => {
    const utf8 = new TextEncoder().encode(string.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const formatCountdown = (targetTime) => {
    const diff = new Date(targetTime) - currentTime;
    if (diff <= 0) return null;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', flexDirection: 'column' }}>
      <div className="flicker neon-text" style={{ fontSize: '1.5rem' }}>INITIALIZING_SECURE_LINK...</div>
    </div>
  );

  return (
    <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '2rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div className="mono" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>MODULE: {levelData?.isFinished ? 'COMPLETED' : `LEVEL_${userProgress?.level}`}</span>
          <span className="neon-text">AGENT: {user.displayName}</span>
        </div>

        {!levelData?.isFinished ? (
          <>
            {gameConfig.gameStatus === 'standby' ? (
              <div style={{ textAlign: 'center', padding: '3rem', minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '20rem', opacity: 0.02, fontWeight: '900', pointerEvents: 'none' }}>00</div>
                <div className="flicker" style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--secondary)', opacity: 0.3 }}>&lt;PAUSED/&gt;</div>
                <h2 className="mono neon-text" style={{ fontSize: '1.4rem', marginBottom: '1.5rem', letterSpacing: '0.3rem' }}>MISSION_ON_STANDBY</h2>
                <div style={{ height: '1px', background: 'var(--secondary)', width: '100px', opacity: 0.2, marginBottom: '1.5rem' }}></div>
                <p className="mono" style={{ fontSize: '0.8rem', opacity: 0.6, maxWidth: '400px', lineHeight: '1.8' }}>
                  THE GLOBAL DECODING STREAM IS CURRENTLY DEACTIVATED. AWAIT COMMAND FROM BASE FOR INITIALIZATION.
                </p>
                <div className="flicker" style={{ marginTop: '2rem', fontSize: '0.6rem', color: 'var(--secondary)' }}>// MONITORING_ENCRYPTED_FREQUENCIES...</div>
              </div>
            ) : userProgress?.level > gameConfig.unlockedLevel ? (
              <div style={{ textAlign: 'center', padding: '3rem', minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', fontSize: '15vw', fontWeight: '900', color: 'var(--secondary)', opacity: 0.03, pointerEvents: 'none' }}>LOCKED</div>
                <div style={{ position: 'relative', marginBottom: '2rem' }}>
                   <div style={{ fontSize: '4rem', opacity: 0.1 }}>010101</div>
                   <div className="mono neon-text" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', fontWeight: 'bold', fontSize: '1.5rem', letterSpacing: '0.5rem' }}>SECURE</div>
                </div>
                <h2 className="mono" style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--secondary)', letterSpacing: '0.2rem' }}>LEVEL_{userProgress.level}_LOCKED</h2>
                <p className="mono" style={{ fontSize: '0.8rem', opacity: 0.6, maxWidth: '400px', lineHeight: '1.8' }}>
                  CONGRATULATIONS AGENT. YOU HAVE CLEARED ALL ACTIVE LEVELS. WAIT FOR THE NEXT FREQUENCY TO BE UNLOCKED.
                </p>
                <div className="flicker" style={{ marginTop: '2rem', fontSize: '0.6rem', color: 'var(--primary)' }}>// SCANNING_FOR_UNLOCK_SIGNAL...</div>
              </div>
            ) : (
              <>
                <div style={{ minHeight: '300px', background: '#000', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                   {isFetching && <div style={{ position: 'absolute', top: 10, right: 10, fontSize: '0.6rem', color: 'var(--primary)' }} className="flicker mono">UPDATING...</div>}
                   <img src={levelData?.image || "https://placehold.co/600x400/000000/00FF41?text=INITIALIZING..."} alt="Decode this" style={{ maxWidth: '100%', maxHeight: '400px' }} />
                </div>

                <div style={{ marginBottom: '1.5rem', minHeight: '4rem' }}>
                  {(levelData?.hintUnlockTime && new Date(levelData.hintUnlockTime) > currentTime && !debugHintOverride) ? (
                    <div className="glass-panel" style={{ padding: '12px', background: 'rgba(0, 229, 255, 0.03)', border: '1px dashed var(--secondary)', textAlign: 'center' }}>
                       <div className="mono neon-text flicker" style={{ fontSize: '1.2rem', color: 'var(--secondary)' }}>
                         {formatCountdown(levelData.hintUnlockTime)}
                       </div>
                    </div>
                  ) : (
                    <p className="mono" style={{ fontSize: '0.9rem' }}>
                      <span className="neon-text">[HINT]:</span> {levelData?.hint || 'No hints available.'}
                    </p>
                  )}
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="ENTER_DECODED_STRING..." autoComplete="off" disabled={isFetching} />
                  <button type="submit" disabled={isFetching}>SUBMIT</button>
                </form>
                {status && <div className="mono" style={{ marginTop: '1rem' }}>&gt; {status}</div>}
              </>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', opacity: 0.05, top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              <div className="flicker" style={{ fontSize: '10vw', fontWeight: '900', position: 'absolute', left: '10%', top: '20%' }}>DECODED</div>
            </div>
            <h2 className="neon-text flicker" style={{ fontSize: '2rem', marginBottom: '1.5rem', letterSpacing: '0.4rem' }}>OPERATION_COMPLETE</h2>
            <div style={{ height: '2px', background: 'var(--primary)', width: '80px', marginBottom: '2rem' }}></div>
            <p className="mono" style={{ fontSize: '0.9rem', opacity: 0.8, maxWidth: '450px', lineHeight: '1.8' }}>
              YOU HAVE SUCCESSFULLY DECRYPTED ALL AVAILABLE DATA STREAMS. REMAIN VIGILANT FOR THE NEXT WAVE OF INTEL.
            </p>
            <div style={{ marginTop: '3rem', width: '100%', height: '1px', background: 'var(--primary)', opacity: 0.2 }}></div>
            <div className="mono" style={{ fontSize: '0.6rem', opacity: 0.4, marginTop: '1rem' }}>SYSTEM_STATUS: IDLE // AWAITING_NEW_PARAMETERS</div>
          </div>
        )}

        {isAdmin && (
          <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px dashed var(--glass-border)' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={async () => {
                   const userRef = doc(db, 'users', user.uid);
                   await updateDoc(userRef, { level: increment(1), updatedAt: new Date().toISOString() });
                   setUserProgress(prev => ({ ...prev, level: prev.level + 1 }));
                   fetchLevel(userProgress.level + 1);
                }} 
                style={{ fontSize: '0.6rem' }}
              >
                SKIP
              </button>
              <button 
                onClick={async () => {
                  const userRef = doc(db, 'users', user.uid);
                  await updateDoc(userRef, { level: 1, updatedAt: new Date().toISOString() });
                  setUserProgress({ level: 1 });
                  fetchLevel(1);
                }} 
                style={{ fontSize: '0.6rem' }}
              >
                RESET
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 className="mono neon-text" style={{ fontSize: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--primary)', paddingBottom: '0.5rem' }}>
          LIVE_RANKINGS
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {leaderboard.map((item, index) => {
            const isFirst = index === 0;
            return (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', padding: isFirst ? '10px' : '0', background: isFirst ? 'rgba(0, 255, 65, 0.05)' : 'transparent', border: isFirst ? '1px solid var(--primary)' : 'none', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '24px' }}>
                    <span className="mono" style={{ opacity: 0.5 }}>#{index + 1}</span>
                    {isFirst && <span className="mono flicker" style={{ fontSize: '0.4rem', color: 'var(--primary)' }}>LEADING</span>}
                  </div>
                  {item.photoURL && <img src={item.photoURL} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%', border: isFirst ? '1.5px solid var(--primary)' : '1px solid var(--glass-border)' }} />}
                  <span className="mono">{item.displayName?.split(' ')[0]}</span>
                </div>
                <span className="neon-text mono">LVL_{item.level}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
