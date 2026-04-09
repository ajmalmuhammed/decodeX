"use client";
import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [levels, setLevels] = useState([]);
  const [users, setUsers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [newLevel, setNewLevel] = useState({ id: '', answer: '', hint: '', image: '' });
  const [newMatch, setNewMatch] = useState({ players: [], gameType: 'carrom', round: 'Round 1' });
  const [status, setStatus] = useState('');

  const adminEmail = 'muhammed.ajmal@webcardio.com';

  useEffect(() => {
    if (user) {
      console.log("Logged in as:", user.email);
    }
  }, [user]);

  // 1. Auth Check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Levels, Users, and Matches
  useEffect(() => {
    if (user?.email?.toLowerCase() !== adminEmail) return;
    
    const qLevels = query(collection(db, 'levels'), orderBy('id', 'asc'));
    const unsubLevels = onSnapshot(qLevels, (snap) => {
      const list = [];
      snap.forEach(doc => list.push(doc.data()));
      setLevels(list);
      const nextId = `level_${list.length + 1}`;
      setNewLevel(prev => ({ ...prev, id: nextId }));
    });

    const qUsers = query(collection(db, 'users'), orderBy('displayName', 'asc'));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      const list = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setUsers(list);
    });

    const qMatches = query(collection(db, 'matches'), orderBy('id', 'desc'));
    const unsubMatches = onSnapshot(qMatches, (snap) => {
      const list = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setMatches(list);
    });

    return () => { unsubLevels(); unsubUsers(); unsubMatches(); };
  }, [user]);

  const handleAddMatch = async (e) => {
    e.preventDefault();
    if (newMatch.players.length < 2) return;
    
    const matchId = `match_${Date.now()}`;
    const selectedPlayers = users.filter(u => newMatch.players.includes(u.id));
    
    try {
      await setDoc(doc(db, 'matches', matchId), {
        id: matchId,
        gameType: newMatch.gameType,
        players: selectedPlayers.map(p => ({ id: p.id, name: p.displayName, photo: p.photoURL })),
        round: newMatch.round,
        winner: null,
        status: 'pending'
      });
      setNewMatch({ players: [], gameType: 'carrom', round: 'Round 1' });
    } catch (err) { console.error(err); }
  };

  const setWinner = async (matchId, player) => {
    try {
      await setDoc(doc(db, 'matches', matchId), { 
        winner: player, 
        status: 'completed' 
      }, { merge: true });
    } catch (err) { console.error(err); }
  };

  const deleteMatch = async (matchId) => {
    if (!confirm('Delete this match?')) return;
    try { await deleteDoc(doc(db, 'matches', matchId)); } catch (err) { console.error(err); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newLevel.id || !newLevel.answer || !newLevel.image) return;
    
    setStatus('SAVING...');
    try {
      await setDoc(doc(db, 'levels', newLevel.id), newLevel);
      setStatus('LEVEL_ADDED_SUCCESSFULLY');
      setNewLevel({ id: '', answer: '', hint: '', image: '' });
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      console.error(err);
      setStatus('ERROR_SAVING_LEVEL');
    }
  };

  const handleDelete = async (levelId) => {
    if (!confirm(`Delete ${levelId}?`)) return;
    try {
      await deleteDoc(doc(db, 'levels', levelId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="mono neon-text" style={{ padding: '2rem' }}>VERIFYING_CREDENTIALS...</div>;

  if (!user || user.email?.toLowerCase() !== adminEmail) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <h1 className="flicker" style={{ color: 'var(--accent)' }}>ACCESS_DENIED</h1>
        <p className="mono">ONLY_AUTHORIZED_AGENTS_ALLOWED</p>
        <a href="/"><button style={{ marginTop: '2rem' }}>RETURN_TO_BASE</button></a>
      </div>
    );
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div className="mono" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="neon-text">ADMIN_CONTROL_PANEL</h1>
        <a href="/"><button style={{ fontSize: '0.7rem' }}>BACK_TO_GAME</button></a>
      </div>

      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
        
        {/* Left: Add Level Form */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 className="mono" style={{ marginBottom: '1.5rem' }}>ADD_NEW_LEVEL</h3>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="mono" style={{ fontSize: '0.7rem', opacity: 0.7 }}>LEVEL_ID (e.g. level_4)</label>
              <input 
                value={newLevel.id} 
                onChange={e => setNewLevel(prev => ({ ...prev, id: e.target.value }))}
                placeholder="level_X"
                required
              />
            </div>
            <div>
              <label className="mono" style={{ fontSize: '0.7rem', opacity: 0.7 }}>DECODED_ANSWER</label>
              <input 
                value={newLevel.answer} 
                onChange={e => setNewLevel(prev => ({ ...prev, answer: e.target.value }))}
                placeholder="What is the secret?"
                required
              />
            </div>
            <div>
              <label className="mono" style={{ fontSize: '0.7rem', opacity: 0.7 }}>IMAGE_PATH (Manually add to public/ folder!)</label>
              <input 
                value={newLevel.image} 
                onChange={e => setNewLevel(prev => ({ ...prev, image: e.target.value }))}
                placeholder="/level_image.jpg"
                required
              />
            </div>
            <div>
              <label className="mono" style={{ fontSize: '0.7rem', opacity: 0.7 }}>LEVEL_HINT (Optional)</label>
              <input 
                value={newLevel.hint} 
                onChange={e => setNewLevel(prev => ({ ...prev, hint: e.target.value }))}
                placeholder="Give them a clue..."
              />
            </div>
            <button type="submit" style={{ background: 'var(--primary)', color: 'black', marginTop: '1rem' }}>
              SAVE_SECURE_COORDINATES
            </button>
            {status && <p className="mono neon-text" style={{ fontSize: '0.8rem', textAlign: 'center' }}>{status}</p>}
          </form>
        </div>

        {/* Right: Current Levels List */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 className="mono" style={{ marginBottom: '1.5rem' }}>CURRENT_LEVELS</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {levels.map(lvl => (
              <div key={lvl.id} style={{ padding: '10px', border: '1px solid var(--glass-border)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <img src={lvl.image} alt="" style={{ width: '50px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--glass-border)' }} />
                  <div>
                    <span className="neon-text mono">{lvl.id}:</span> {lvl.answer} <br/>
                    <span className="mono" style={{ opacity: 0.5 }}>PATH: {lvl.image}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(lvl.id)}
                  style={{ border: '1px solid var(--accent)', color: 'var(--accent)', padding: '5px 10px', fontSize: '0.6rem' }}
                >
                  DELETE
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* --- TOURNAMENT SECTION --- */}
      <div className="mono neon-text" style={{ margin: '3rem 0 1.5rem 0', borderBottom: '1px solid var(--primary)', paddingBottom: '0.5rem' }}>
        TOURNAMENT_COMMAND_CENTER
      </div>

      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
        
        {/* Create Match */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 className="mono" style={{ marginBottom: '1.5rem' }}>CREATE_MATCH</h3>
          <form onSubmit={handleAddMatch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="mono" style={{ fontSize: '0.7rem', opacity: 0.7 }}>GAME_TYPE</label>
              <select 
                value={newMatch.gameType}
                onChange={e => setNewMatch(prev => ({ ...prev, gameType: e.target.value }))}
                style={{ width: '100%', background: 'rgba(255,255,255,0.1)', color: 'white', padding: '10px', border: '1px solid var(--glass-border)', outline: 'none' }}
              >
                <option value="carrom" style={{ background: '#000' }}>CARROM (1v1)</option>
                <option value="ludo" style={{ background: '#000' }}>LUDO (Group of 4)</option>
              </select>
            </div>
            
            <div>
              <label className="mono" style={{ fontSize: '0.7rem', opacity: 0.7 }}>SELECT_PLAYERS (Hold Ctrl/Cmd to select multiple)</label>
              <select 
                multiple
                value={newMatch.players}
                onChange={e => setNewMatch(prev => ({ ...prev, players: Array.from(e.target.selectedOptions, option => option.value) }))}
                style={{ width: '100%', background: 'rgba(255,255,255,0.1)', color: 'white', padding: '10px', border: '1px solid var(--glass-border)', height: '120px' }}
              >
                {users.map(u => (
                  <option key={u.id} value={u.id} style={{ background: '#000' }}>{u.displayName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mono" style={{ fontSize: '0.7rem', opacity: 0.7 }}>ROUND / GROUP NAME</label>
              <input 
                value={newMatch.round}
                onChange={e => setNewMatch(prev => ({ ...prev, round: e.target.value }))}
                placeholder="Quarter Finals / Group A"
              />
            </div>

            <button type="submit" style={{ background: 'var(--secondary)', color: 'black' }}>
              INITIALIZE_MATCH
            </button>
          </form>
        </div>

        {/* Match List */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 className="mono" style={{ marginBottom: '1.5rem' }}>ACTIVE_MATCHES</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {matches.map(m => (
              <div key={m.id} className="mono" style={{ padding: '15px', border: '1px solid var(--glass-border)', borderRadius: '4px', background: m.status === 'completed' ? 'rgba(0,255,65,0.05)' : 'transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span className="neon-text" style={{ fontSize: '0.7rem' }}>{m.gameType.toUpperCase()} | {m.round}</span>
                  <button onClick={() => deleteMatch(m.id)} style={{ padding: '2px 5px', fontSize: '0.5rem', border: '1px solid var(--accent)', color: 'var(--accent)' }}>DEL</button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                  {m.players.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => m.status === 'pending' && setWinner(m.id, p)}
                      style={{ 
                        padding: '5px', 
                        textAlign: 'center', 
                        border: '1px solid',
                        borderColor: m.winner?.id === p.id ? 'var(--primary)' : 'var(--glass-border)',
                        cursor: m.status === 'pending' ? 'pointer' : 'default',
                        opacity: m.status === 'completed' && m.winner?.id !== p.id ? 0.3 : 1
                      }}
                    >
                      <img src={p.photo} style={{ width: '30px', height: '30px', borderRadius: '50%', marginBottom: '5px' }} />
                      <div style={{ fontSize: '0.6rem', overflow: 'hidden' }}>{p.name.split(' ')[0]}</div>
                      {m.winner?.id === p.id && <div style={{ fontSize: '0.5rem', color: 'var(--primary)' }}>WINNER</div>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {matches.length === 0 && <p className="mono" style={{ opacity: 0.5, fontSize: '0.8rem' }}>NO_MATCHES_SCHEDULED</p>}
          </div>
        </div>

      </div>

      <div className="glass-panel" style={{ marginTop: '2rem', padding: '1.5rem', borderLeft: '4px solid var(--secondary)' }}>
        <h4 className="mono neon-text" style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--secondary)' }}>! INSTRUCTIONS_FOR_ADMIN</h4>
        <p className="mono" style={{ fontSize: '0.75rem', lineHeight: '1.5' }}>
          1. Copy your image into the <span style={{ color: 'var(--secondary)' }}>public/</span> folder on your computer.<br/>
          2. Push to GitHub to deploy it.<br/>
          3. On this page, add the level and use the path like <span style={{ color: 'var(--secondary)' }}>/image_name.png</span>.<br/>
          4. Ensure your Firestore Security Rules allow WRITE access to your email.
        </p>
      </div>
    </main>
  );
}
