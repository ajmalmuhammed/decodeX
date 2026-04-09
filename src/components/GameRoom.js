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
    // Note: This composite sort requires a Firestore index. 
    // Check your browser console for the index creation link if rankings don't appear.
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
      console.error("Leaderboard Error:", error);
      // Fallback if index isn't ready
      if (error.code === 'failed-precondition') {
        const fallbackQ = query(collection(db, 'users'), orderBy('level', 'desc'), limit(10));
        onSnapshot(fallbackQ, (snap) => {
          const board = [];
          snap.forEach(doc => board.push({ id: doc.id, ...doc.data() }));
          setLeaderboard(board);
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('VALIDATING...');

    try {
      if (answer.toLowerCase().trim() === levelData?.answer?.toLowerCase()?.trim()) {
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
          <div style={{ textAlign: 'center', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
            <h2 className="neon-text flicker" style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>OPERATION_COMPLETE</h2>
            <p className="mono" style={{ fontSize: '0.9rem', opacity: 0.8, maxWidth: '400px' }}>
              YOU HAVE DECODED ALL AVAILABLE INTEL. STAND BY FOR FURTHER INSTRUCTIONS FROM BASE COMMAND.
            </p>
            <div style={{ marginTop: '2rem', width: '100%', height: '1px', background: 'var(--primary)', opacity: 0.3 }}></div>
          </div>
        )}
      </div>

      {/* Right Part: Leaderboard */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 className="mono neon-text" style={{ fontSize: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--primary)', paddingBottom: '0.5rem' }}>
          LIVE_RANKINGS
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {leaderboard.map((item, index) => {
            const isFirst = index === 0;
            return (
              <div 
                key={item.id} 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '4px',
                  padding: isFirst ? '10px' : '0',
                  background: isFirst ? 'rgba(0, 255, 65, 0.05)' : 'transparent',
                  border: isFirst ? '1px solid var(--primary)' : 'none',
                  borderRadius: isFirst ? '8px' : '0',
                  boxShadow: isFirst ? '0 0 15px rgba(0, 255, 65, 0.2)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '24px' }}>
                      <span className="mono" style={{ opacity: 0.5, color: isFirst ? 'var(--primary)' : 'inherit' }}>
                        #{index + 1}
                      </span>
                      {isFirst && (
                        <span className="mono flicker" style={{ fontSize: '0.4rem', color: 'var(--primary)', fontWeight: 'bold', marginTop: '2px' }}>
                          LEADING
                        </span>
                      )}
                    </div>
                    {item.photoURL && (
                      <img src={item.photoURL} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%', border: isFirst ? '1.5px solid var(--primary)' : '1px solid var(--glass-border)' }} />
                    )}
                    <span className="mono" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px', fontWeight: isFirst ? 'bold' : 'normal' }}>
                      {item.displayName}
                    </span>
                  </div>
                  <span className="neon-text mono">LVL_{item.level}</span>
                </div>
              </div>
            );
          })}
          {leaderboard.length === 0 && <p className="mono" style={{ fontSize: '0.7rem', opacity: 0.5 }}>NO_AGENTS_ONLINE</p>}
        </div>
      </div>
    </div>
  );
}
