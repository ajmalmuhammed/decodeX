"use client";
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, query, orderBy, limit, onSnapshot, setDoc, increment } from 'firebase/firestore';

export default function GameRoom({ user }) {
  const [levelData, setLevelData] = useState(null);
  const [userProgress, setUserProgress] = useState({ level: 1 });
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch User Progress
  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    
    // Create user profile if it doesn't exist
    const setupUser = async () => {
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
    };

    setupUser();
  }, [user]);

  // 2. Fetch Current Level Data
  useEffect(() => {
    const fetchLevel = async () => {
      setLoading(true);
      const levelRef = doc(db, 'levels', `level_${userProgress.level}`);
      const snap = await getDoc(levelRef);
      if (snap.exists()) {
        setLevelData(snap.data());
      } else {
        // Handle case where we run out of levels
        setLevelData({ 
          image: '/congrats.gif', 
          hint: 'You have completed all levels, Agent!',
          isFinished: true 
        });
      }
      setLoading(false);
    };

    fetchLevel();
  }, [userProgress.level]);

  // 3. Real-time Leaderboard
  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('level', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snap) => {
      const board = [];
      snap.forEach(doc => board.push({ id: doc.id, ...doc.data() }));
      setLeaderboard(board);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('VALIDATING...');

    try {
      // In a real app, do this validation via fetch('/api/validate')
      // For now, I'll show the logic. 
      // If the answer matches (case insensitive check)
      if (answer.toLowerCase().trim() === levelData?.answer?.toLowerCase()?.trim()) {
        setStatus('SUCCESS! ACCESS GRANTED.');
        
        // Update user level in Firestore
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          level: increment(1),
          updatedAt: new Date().toISOString()
        });

        // Trigger local re-render
        setUserProgress(prev => ({ ...prev, level: prev.level + 1 }));
        setAnswer('');
      } else {
        setStatus('ERROR: INCORRECT_KEY');
        setTimeout(() => setStatus(''), 2000);
      }
    } catch (err) {
      console.error(err);
      setStatus('SYSTEM_ERROR');
    }
  };

  if (loading) return <div className="mono neon-text">LOADING_SECURE_CHANNEL...</div>;

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
            <div style={{ minHeight: '300px', background: '#000', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               {/* Replace with <img> once storage is ready */}
               <div style={{ padding: '20px', textAlign: 'center' }}>
                  <img src={levelData?.image || "https://placehold.co/600x400/000000/00FF41?text=INITIALIZING_IMAGE"} alt="Decode this" style={{ maxWidth: '100%', maxHeight: '400px' }} />
               </div>
            </div>

            <p className="mono" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <span className="neon-text">[HINT]:</span> {levelData?.hint || 'No hints available.'}
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                value={answer} 
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="ENTER_DECODED_STRING..."
                autoComplete="off"
              />
              <button type="submit">SUBMIT</button>
            </form>
            
            {status && <div className={`mono ${status.includes('SUCCESS') ? 'neon-text' : 'flicker'}`} style={{ marginTop: '1rem', color: status.includes('ERROR') ? 'var(--accent)' : 'inherit' }}>
              &gt; {status}
            </div>}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <h2 className="neon-text">OPERATION_COMPLETE</h2>
            <p>You have decoded everything. Stand by for further instructions.</p>
          </div>
        )}
      </div>

      {/* Right Part: Leaderboard */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 className="mono neon-text" style={{ fontSize: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--primary)', paddingBottom: '0.5rem' }}>
          LIVE_RANKINGS
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {leaderboard.map((item, index) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="mono" style={{ opacity: 0.5 }}>#{index + 1}</span>
                {item.photoURL && (
                  <img src={item.photoURL} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid var(--primary)' }} />
                )}
                <span className="mono" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>
                  {item.displayName}
                </span>
              </div>
              <span className="neon-text mono">LVL_{item.level}</span>
            </div>
          ))}
          {leaderboard.length === 0 && <p className="mono" style={{ fontSize: '0.7rem', opacity: 0.5 }}>NO_AGENTS_ONLINE</p>}
        </div>
      </div>
    </div>
  );
}
