"use client";
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import AuthGuard from '@/components/AuthGuard';
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

export default function AdminPage() {
  const [levels, setLevels] = useState([]);
  const [users, setUsers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [newLevel, setNewLevel] = useState({ id: '', answer: '', hint: '', image: '', hintUnlockTime: '' });
  const [newMatch, setNewMatch] = useState({ players: [], gameType: 'carrom', round: 'Round 1' });
  const [status, setStatus] = useState('');
  const [gameConfig, setGameConfig] = useState({ gameStatus: 'standby', unlockedLevel: 1 });
  const [editingLevelId, setEditingLevelId] = useState(null);
  const [revealedAnswers, setRevealedAnswers] = useState([]);
  const [showFormAnswer, setShowFormAnswer] = useState(false);

  const setupDataSubscriptions = () => {
    const qLevels = query(collection(db, 'levels'), orderBy('id', 'asc'));
    const unsubLevels = onSnapshot(qLevels, (snap) => {
      const list = [];
      snap.forEach(doc => list.push(doc.data()));
      setLevels(list);
      if (!editingLevelId) {
        const nextId = `level_${list.length + 1}`;
        setNewLevel(prev => ({ ...prev, id: nextId }));
      }
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

    const unsubConfig = onSnapshot(doc(db, 'metadata', 'gameConfig'), (snap) => {
      if (snap.exists()) {
        setGameConfig(snap.data());
      } else {
        setDoc(doc(db, 'metadata', 'gameConfig'), { gameStatus: 'standby', unlockedLevel: 1 });
      }
    });

    return () => { unsubLevels(); unsubUsers(); unsubMatches(); unsubConfig(); };
  };

  useEffect(() => {
    const cleanup = setupDataSubscriptions();
    return () => cleanup && cleanup();
  }, []);

  const updateGameConfig = async (newConfig) => {
    try {
      await setDoc(doc(db, 'metadata', 'gameConfig'), newConfig, { merge: true });
      setStatus('CONFIG_UPDATED');
      setTimeout(() => setStatus(''), 2000);
    } catch (err) { console.error(err); }
  };

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
      await setDoc(doc(db, 'matches', matchId), { winner: player, status: 'completed' }, { merge: true });
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
      const levelToSave = { 
        ...newLevel, 
        hintUnlockTime: newLevel.hintUnlockTime ? new Date(newLevel.hintUnlockTime).toISOString() : '' 
      };
      await setDoc(doc(db, 'levels', newLevel.id), levelToSave);
      setStatus(editingLevelId ? 'LEVEL_UPDATED' : 'LEVEL_ADDED');
      setNewLevel({ id: '', answer: '', hint: '', image: '', hintUnlockTime: '' });
      setEditingLevelId(null);
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      console.error(err);
      setStatus('ERROR_SAVING');
    }
  };

  return (
    <AuthGuard adminOnly>
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="mono" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="neon-text">ADMIN_CONTROL_PANEL</h1>
          <a href="/"><button style={{ fontSize: '0.7rem' }}>BACK_TO_BASE</button></a>
        </div>

        {/* --- MISSION CONTROL --- */}
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem', borderLeft: '4px solid var(--primary)', background: 'rgba(0, 255, 65, 0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
            <div>
              <h2 className="mono neon-text" style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>&gt; MISSION_CONTROL</h2>
              <p className="mono" style={{ fontSize: '0.7rem', opacity: 0.6 }}>SYSTEM_STATUS: {gameConfig.gameStatus.toUpperCase()}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div className="mono" style={{ fontSize: '0.6rem', opacity: 0.5, marginBottom: '5px' }}>GLOBAL_ACCESS</div>
                <button onClick={() => updateGameConfig({ gameStatus: gameConfig.gameStatus === 'active' ? 'standby' : 'active' })} style={{ background: gameConfig.gameStatus === 'active' ? 'var(--accent)' : 'var(--primary)', color: 'black', minWidth: '140px' }}>
                  {gameConfig.gameStatus === 'active' ? '[ STOP_MISSION ]' : '[ START_MISSION ]'}
                </button>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="mono" style={{ fontSize: '0.6rem', opacity: 0.5, marginBottom: '5px' }}>UNLOCKED_LEVEL</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '2px 10px', borderRadius: '4px', border: '1px solid var(--glass-border)' }}>
                  <button onClick={() => updateGameConfig({ unlockedLevel: Math.max(1, gameConfig.unlockedLevel - 1) })} style={{ border: 'none', padding: '5px', fontSize: '1.2rem' }}>-</button>
                  <span className="mono neon-text" style={{ fontSize: '1.2rem', minWidth: '30px', textAlign: 'center' }}>{gameConfig.unlockedLevel}</span>
                  <button onClick={() => updateGameConfig({ unlockedLevel: gameConfig.unlockedLevel + 1 })} style={{ border: 'none', padding: '5px', fontSize: '1.2rem' }}>+</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
          
          {/* Add/Edit Level Form */}
          <div className="glass-panel" style={{ padding: '1.5rem', border: editingLevelId ? '1px solid var(--secondary)' : '1px solid var(--glass-border)' }}>
            <h3 className="mono" style={{ marginBottom: '1.5rem', color: editingLevelId ? 'var(--secondary)' : 'inherit' }}>
              {editingLevelId ? `EDIT_LEVEL: ${editingLevelId}` : 'ADD_NEW_LEVEL'}
            </h3>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="mono" style={{ fontSize: '0.7rem', opacity: 0.7 }}>LEVEL_ID</label>
                <input value={newLevel.id} onChange={e => setNewLevel(prev => ({ ...prev, id: e.target.value }))} disabled={!!editingLevelId} placeholder="level_X" required />
              </div>
              <div>
                <label className="mono" style={{ fontSize: '0.7rem', opacity: 0.7 }}>DECODED_ANSWER</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showFormAnswer ? "text" : "password"} 
                    value={newLevel.answer} 
                    onChange={e => setNewLevel(prev => ({ ...prev, answer: e.target.value }))} 
                    placeholder="The Answer" 
                    required 
                    style={{ paddingRight: '40px' }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowFormAnswer(!showFormAnswer)}
                    style={{ 
                      position: 'absolute', 
                      right: '0', 
                      top: '0', 
                      height: '100%', 
                      border: 'none', 
                      background: 'rgba(255,255,255,0.05)',
                      fontSize: '0.6rem',
                      width: '40px',
                      padding: '0'
                    }}
                  >
                    {showFormAnswer ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>
              <div>
                <label className="mono" style={{ fontSize: '0.7rem', opacity: 0.7 }}>IMAGE_PATH</label>
                <input value={newLevel.image} onChange={e => setNewLevel(prev => ({ ...prev, image: e.target.value }))} placeholder="/image.jpg" required />
              </div>
              <div>
                <label className="mono" style={{ fontSize: '0.7rem', opacity: 0.7 }}>HINT</label>
                <input value={newLevel.hint} onChange={e => setNewLevel(prev => ({ ...prev, hint: e.target.value }))} placeholder="Optional Hint" />
              </div>
              <div>
                <label className="mono" style={{ fontSize: '0.7rem', opacity: 0.7 }}>HINT_REVEAL_TIME</label>
                <input type="datetime-local" value={newLevel.hintUnlockTime} onChange={e => setNewLevel(prev => ({ ...prev, hintUnlockTime: e.target.value }))} style={{ width: '100%', background: 'rgba(255,255,255,0.1)', color: 'white', padding: '10px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flex: 2, background: editingLevelId ? 'var(--secondary)' : 'var(--primary)', color: 'black', marginTop: '1rem' }}>
                  {editingLevelId ? 'UPDATE_MISSION' : 'SAVE_COORDINATES'}
                </button>
                {editingLevelId && <button type="button" onClick={() => {setEditingLevelId(null); setNewLevel({id: `level_${levels.length+1}`, answer:'', hint:'', image:'', hintUnlockTime:''}) }} style={{ flex: 1, marginTop: '1rem', borderColor: 'var(--accent)', color: 'var(--accent)' }}>CANCEL</button>}
              </div>
              {status && <p className="mono neon-text" style={{ fontSize: '0.8rem', textAlign: 'center' }}>{status}</p>}
            </form>
          </div>

          {/* Levels List */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 className="mono" style={{ marginBottom: '1.5rem' }}>CURRENT_LEVELS</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {levels.map(lvl => {
                const isRevealed = revealedAnswers.includes(lvl.id);
                return (
                  <div key={lvl.id} style={{ padding: '10px', border: '1px solid var(--glass-border)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <img src={lvl.image} alt="" style={{ width: '50px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--glass-border)' }} />
                      <div>
                        <span className="neon-text mono">{lvl.id}:</span> 
                        <span style={{ marginLeft: '10px', verticalAlign: 'middle' }}>
                          {isRevealed ? lvl.answer : '********'}
                        </span>
                        <button 
                          onClick={() => setRevealedAnswers(prev => 
                            isRevealed ? prev.filter(id => id !== lvl.id) : [...prev, lvl.id]
                          )}
                          style={{ 
                            marginLeft: '10px', 
                            padding: '2px 6px', 
                            fontSize: '0.6rem', 
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.2)',
                            verticalAlign: 'middle'
                          }}
                        >
                          {isRevealed ? 'HIDE' : 'VIEW'}
                        </button>
                        <br/>
                        <span className="mono" style={{ opacity: 0.5 }}>PATH: {lvl.image}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => {
                        setEditingLevelId(lvl.id); 
                        // Convert UTC ISO back to local datetime-local format for editing
                        const localTime = lvl.hintUnlockTime ? new Date(lvl.hintUnlockTime).toLocaleString('sv').replace(' ', 'T').slice(0, 16) : '';
                        setNewLevel({ ...lvl, hintUnlockTime: localTime }); 
                        window.scrollTo({top:0, behavior:'smooth'}); 
                      }} style={{ padding: '5px 10px', fontSize: '0.6rem', borderColor: 'var(--secondary)', color: 'var(--secondary)' }}>EDIT</button>
                      <button onClick={async () => {if(confirm(`Delete ${lvl.id}?`)) await deleteDoc(doc(db, 'levels', lvl.id))}} style={{ padding: '5px 10px', fontSize: '0.6rem', borderColor: 'var(--accent)', color: 'var(--accent)' }}>DEL</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tournament Admin */}
        <div className="mono neon-text" style={{ margin: '3rem 0 1.5rem 0', borderBottom: '1px solid var(--primary)', paddingBottom: '0.5rem' }}>TOURNAMENT_COMMAND</div>
        <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 className="mono" style={{ marginBottom: '1.5rem' }}>CREATE_MATCH</h3>
            <form onSubmit={handleAddMatch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <select value={newMatch.gameType} onChange={e => setNewMatch(prev => ({ ...prev, gameType: e.target.value }))} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                <option value="carrom" style={{ background: '#000' }}>CARROM (1v1)</option>
                <option value="ludo" style={{ background: '#000' }}>LUDO (Group of 4)</option>
              </select>
              <select multiple value={newMatch.players} onChange={e => setNewMatch(prev => ({ ...prev, players: Array.from(e.target.selectedOptions, o => o.value) }))} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.1)', color: 'white', height: '120px' }}>
                {users.map(u => <option key={u.id} value={u.id} style={{ background: '#000' }}>{u.displayName}</option>)}
              </select>
              <input value={newMatch.round} onChange={e => setNewMatch(prev => ({ ...prev, round: e.target.value }))} placeholder="Round Name" />
              <button type="submit" style={{ background: 'var(--secondary)', color: 'black' }}>INITIALIZE</button>
            </form>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 className="mono" style={{ marginBottom: '1.5rem' }}>ACTIVE_MATCHES</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {matches.map(m => (
                <div key={m.id} style={{ padding: '15px', border: '1px solid var(--glass-border)', background: m.status === 'completed' ? 'rgba(0,255,65,0.05)' : 'transparent' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span className="neon-text" style={{ fontSize: '0.7rem' }}>{m.gameType.toUpperCase()} | {m.round}</span>
                    <button onClick={() => deleteMatch(m.id)} style={{ padding: '2px 5px', fontSize: '0.5rem', borderColor: 'var(--accent)', color: 'var(--accent)' }}>DEL</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '10px' }}>
                    {m.players.map(p => (
                      <div key={p.id} onClick={() => m.status === 'pending' && setWinner(m.id, p)} style={{ padding: '5px', textAlign: 'center', border: '1px solid', borderColor: m.winner?.id === p.id ? 'var(--primary)' : 'var(--glass-border)', cursor: m.status === 'pending' ? 'pointer' : 'default', opacity: m.status === 'completed' && m.winner?.id !== p.id ? 0.3 : 1 }}>
                        <img src={p.photo} style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
                        <div style={{ fontSize: '0.6rem' }}>{p.name.split(' ')[0]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
