"use client";
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

export default function TournamentBoard() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'matches'), orderBy('id', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setMatches(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="mono neon-text">LOADING_TOURNAMENT_DATA...</div>;

  const getRounds = (type) => {
    const list = matches.filter(m => m.gameType === type);
    const grouped = {};
    list.forEach(m => {
      if (!grouped[m.round]) grouped[m.round] = [];
      grouped[m.round].push(m);
    });
    // Sort rounds semi-logically (could be improved with custom order)
    return Object.keys(grouped).sort().map(r => ({ name: r, matches: grouped[r] }));
  };

  const carromRounds = getRounds('carrom');
  const ludoRounds = getRounds('ludo');

  const MatchCard = ({ match }) => (
    <div className="glass-panel" style={{ padding: '12px', minWidth: '220px', borderLeft: `3px solid ${match.status === 'completed' ? 'var(--primary)' : 'var(--secondary)'}`, marginBottom: '15px' }}>
      <div className="mono" style={{ fontSize: '0.6rem', opacity: 0.4, marginBottom: '8px' }}>
        {match.status.toUpperCase()}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {match.players.map((p, idx) => {
          const isWinner = match.winner?.id === p.id;
          const isLoser = match.status === 'completed' && !isWinner;
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: isLoser ? 0.3 : 1 }}>
              <img src={p.photo} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%', border: isWinner ? '1.5px solid var(--primary)' : '1px solid var(--glass-border)' }} />
              <div className="mono" style={{ fontSize: '0.75rem', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
              {isWinner && <span style={{ fontSize: '10px' }}>👑</span>}
            </div>
          );
        })}
      </div>
    </div>
  );

  const RoundColumn = ({ round, color }) => (
    <div style={{ minWidth: '250px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="mono" style={{ color: color, fontSize: '0.8rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>
        &gt; {round.name.toUpperCase()}
      </div>
      <div style={{ width: '100%', padding: '0 10px' }}>
        {round.matches.map(m => <MatchCard key={m.id} match={m} />)}
      </div>
    </div>
  );

  return (
    <div style={{ width: '100%', maxWidth: '100vw', overflowX: 'auto', paddingBottom: '2rem' }}>
      
      {/* Carrom Brackets */}
      <div style={{ marginBottom: '4rem' }}>
        <h2 className="mono neon-text" style={{ fontSize: '1.1rem', marginBottom: '2rem', textAlign: 'center' }}>
          CARROMS
        </h2>
        {carromRounds.length === 0 ? (
          <p className="mono center" style={{ opacity: 0.5, textAlign: 'center' }}>NO_BRACKETS_READY</p>
        ) : (
          <div style={{ display: 'flex', gap: '40px', justifyContent: 'center' }}>
            {carromRounds.map((r, i) => (
              <React.Fragment key={r.name}>
                <RoundColumn round={r} color="var(--primary)" />
                {i < carromRounds.length - 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', opacity: 0.2 }}>
                    <div style={{ width: '40px', borderTop: '1px dashed var(--primary)' }}></div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Ludo Groups */}
      <div>
        <h2 className="mono" style={{ color: 'var(--secondary)', fontSize: '1.1rem', marginBottom: '2rem', textAlign: 'center', textShadow: '0 0 8px var(--secondary)' }}>
          LUDO
        </h2>
        {ludoRounds.length === 0 ? (
          <p className="mono center" style={{ opacity: 0.5, textAlign: 'center' }}>WAITING_FOR_ALLOCATIONS...</p>
        ) : (
          <div style={{ display: 'flex', gap: '40px', justifyContent: 'center' }}>
            {ludoRounds.map(r => <RoundColumn key={r.name} round={r} color="var(--secondary)" />)}
          </div>
        )}
      </div>

    </div>
  );
}
