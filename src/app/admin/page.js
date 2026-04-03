"use client";
import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [levels, setLevels] = useState([]);
  const [newLevel, setNewLevel] = useState({ id: '', answer: '', hint: '', image: '' });
  const [status, setStatus] = useState('');

  const adminEmail = 'muhammed.ajmal@webcardio.com';

  // 1. Auth Check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Levels
  useEffect(() => {
    if (user?.email !== adminEmail) return;
    const q = query(collection(db, 'levels'), orderBy('id', 'asc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach(doc => list.push(doc.data()));
      setLevels(list);
      
      // Auto-suggest next level ID
      const nextId = `level_${list.length + 1}`;
      setNewLevel(prev => ({ ...prev, id: nextId }));
    });
    return () => unsubscribe();
  }, [user]);

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

  if (!user || user.email !== adminEmail) {
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
        
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
                <div>
                  <span className="neon-text mono">{lvl.id}:</span> {lvl.answer} <br/>
                  <span className="mono" style={{ opacity: 0.5 }}>PATH: {lvl.image}</span>
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
