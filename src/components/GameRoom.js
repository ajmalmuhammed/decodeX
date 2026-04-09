"use client";
import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, query, orderBy, limit, onSnapshot, setDoc, increment } from 'firebase/firestore';

export default function GameRoom({ user }) {
  const [levelData, setLevelData] = useState(null);
  const [userProgress, setUserProgress] = useState({ level: 1 });
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [gameConfig, setGameConfig] = useState({ gameStatus: 'active', unlockedLevel: 99 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isUserFetched, setIsUserFetched] = useState(false);
  const [debugHintOverride, setDebugHintOverride] = useState(false);
  
  // Use a ref to prevent stale closure issues in the timer-based trigger
  const fetchInProgress = useRef(false);

  const isAdmin = ['muhammed.ajmal@webcardio.com', 'aysha.s@webcardio.com'].includes(user?.email?.toLowerCase());

  // 1. Fetch User Progress
  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    
    const setupUser = async () => {
      try {
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          const initialData = {
            displayName: user.displayName,
            photoURL: user.photoURL,
            level: 1,
            updatedAt: new Date().toISOString()
          };
          await setDoc(userRef, initialData);
          setUserProgress(initialData);
        } else {
          setUserProgress(snap.data());
        }
        setIsUserFetched(true);
      } catch (err) {
        console.error("Setup User Error:", err);
      }
    };

    setupUser();
  }, [user]);

  // 2. Fetch Current Level Data (Securely)
  const fetchLevel = async (levelId) => {
    if (fetchInProgress.current) return;
    
    fetchInProgress.current = true;
    setIsFetching(true);
    // Only show the main loading screen if we don't have data yet
    if (!levelData) setLoading(true);

    try {
      console.log(`📡 FETCHING_SECURE_INTEL: ${levelId}`);
      const response = await fetch(`/api/level/${levelId}`);
      if (response.ok) {
        const data = await response.json();
        setLevelData(data);
      } else {
        if (userProgress.level > 1) {
          setLevelData({ 
            image: '/congrats.gif', 
            hint: 'You have completed all levels, Agent!',
            isFinished: true 
          });
        } else {
          setStatus('ERROR: SECURE_LINK_FAILURE');
        }
      }
    } catch (err) {
      console.error("Fetch Level Error:", err);
      setStatus('OFFLINE: RECONNECTING...');
    } finally {
      setLoading(false);
      setIsFetching(false);
      fetchInProgress.current = false;
    }
  };

  useEffect(() => {
    if (isUserFetched) {
      fetchLevel(`level_${userProgress.level}`);
    }
  }, [userProgress.level, isUserFetched]);

  // 3. Hint Reveal Observer
  useEffect(() => {
    // Only trigger if we have a locked hint and time has passed
    if (levelData?.hintUnlockTime && !levelData.hint && !levelData.isFinished && !fetchInProgress.current) {
      const unlockTime = new Date(levelData.hintUnlockTime);
      if (currentTime >= unlockTime) {
        console.log("🔓 HINT_THRESHOLD_REACHED");
        fetchLevel(`level_${userProgress.level}`);
      }
    }
  }, [currentTime, levelData, userProgress.level]);

  // 4. Real-time Subscriptions (Leaderboard & Config)
  useEffect(() => {
    const q = query(
      collection(db, 'users'), 
      orderBy('level', 'desc'), 
      orderBy('updatedAt', 'asc'), 
      limit(10)
    );
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const board = [];
      snap.forEach(doc => board.push({ id: doc.id, ...doc.data() }));
      setLeaderboard(board);
    }, (error) => {
      if (error.code === 'failed-precondition') {
        const fallbackQ = query(collection(db, 'users'), orderBy('level', 'desc'), limit(10));
        onSnapshot(fallbackQ, (snap) => {
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
        setStatus('SUCCESS! ACCESS GRANTED.');
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          level: increment(1),
          updatedAt: new Date().toISOString()
        });
        setUserProgress(prev => ({ ...prev, level: prev.level + 1 }));
        setAnswer('');
      } else {
        setStatus('ERROR: INCORRECT_KEY');
        setTimeout(() => setStatus(''), 2000);
      }
    } catch (err) {
      setStatus('SYSTEM_ERROR');
    }
  };

  const forceNextLevel = async () => {
    if (!isAdmin) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { level: increment(1), updatedAt: new Date().toISOString() });
      setUserProgress(prev => ({ ...prev, level: prev.level + 1 }));
      setAnswer('');
    } catch (err) { console.error(err); }
  };

  const resetProgress = async () => {
    if (!isAdmin || !confirm('RESET YOUR PROGRESS?')) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { level: 1, updatedAt: new Date().toISOString() });
      setUserProgress({ level: 1 });
      setLevelData(null);
      setAnswer('');
      setStatus('DEBUG: RESET_SUCCESS');
    } catch (err) { console.error(err); }
  };

  const formatCountdown = (targetTime) => {
    const diff = new Date(targetTime) - currentTime;
    if (diff <= 0) return null;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const hashString = async (string) => {
    const utf8 = new TextEncoder().encode(string.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', flexDirection: 'column' }}>
      <div className="flicker neon-text" style={{ fontSize: '1.5rem' }}>ESTABLISHING_SECURE_CHANNEL...</div>
      <div className="mono" style={{ fontSize: '0.6rem', opacity: 0.4, marginTop: '1rem' }}>ENCRYPTING_COORDINATES...</div>
    </div>
  );

  return (
    <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '2rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Left Part: Game */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div className="mono" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>MODULE: {levelData?.isFinished ? 'COMPLETED' : `LEVEL_${userProgress.level}`}</span>
          <span className="neon-text">AGENT: {user.displayName}</span>
        </div>

        {!levelData?.isFinished ? (
          <>
            {gameConfig.gameStatus === 'standby' ? (
              <div style={{ textAlign: 'center', padding: '3rem', minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div className="flicker" style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--secondary)', opacity: 0.3 }}>&lt;PAUSED/&gt;</div>
                <h2 className="mono neon-text" style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>MISSION_ON_STANDBY</h2>
                <p className="mono" style={{ fontSize: '0.8rem', opacity: 0.6 }}>THE GLOBAL DECODING STREAM IS DEACTIVATED.</p>
              </div>
            ) : userProgress.level > gameConfig.unlockedLevel ? (
              <div style={{ textAlign: 'center', padding: '3rem', minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <h2 className="mono" style={{ fontSize: '1.2rem', color: 'var(--secondary)' }}>LEVEL_{userProgress.level}_LOCKED</h2>
                <p className="mono" style={{ fontSize: '0.8rem', opacity: 0.6 }}>WAIT FOR BASE TO UNLOCK NEXT LEVEL.</p>
              </div>
            ) : (
              <>
                <div style={{ minHeight: '300px', background: '#000', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                   {isFetching && <div style={{ position: 'absolute', top: 10, right: 10, fontSize: '0.6rem', color: 'var(--primary)' }} className="flicker mono">UPDATING...</div>}
                   <div style={{ padding: '20px', textAlign: 'center' }}>
                      <img src={levelData?.image || "https://placehold.co/600x400/000000/00FF41?text=INITIALIZING_IMAGE"} alt="Decode this" style={{ maxWidth: '100%', maxHeight: '400px' }} />
                   </div>
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
          <div style={{ textAlign: 'center', padding: '1rem', minHeight: '300px' }}>
            <h2 className="neon-text flicker">OPERATION_COMPLETE</h2>
            <p className="mono">STAY VIGILANT, AGENT.</p>
          </div>
        )}

        {isAdmin && (
          <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px dashed var(--glass-border)' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={forceNextLevel} style={{ fontSize: '0.6rem' }}>SKIP_LEVEL</button>
              <button onClick={() => setDebugHintOverride(!debugHintOverride)} style={{ fontSize: '0.6rem' }}>{debugHintOverride ? 'RE-LOCK' : 'BYPASS_HINT'}</button>
              <button onClick={resetProgress} style={{ fontSize: '0.6rem' }}>RESET_MY_LEVEL</button>
            </div>
          </div>
        )}
      </div>

      {/* Right Part: Leaderboard */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 className="mono neon-text" style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>LIVE_RANKINGS</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {leaderboard.map((item, index) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span className="mono">#{index + 1} {item.displayName.split(' ')[0]}</span>
              <span className="neon-text mono">LVL_{item.level}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
