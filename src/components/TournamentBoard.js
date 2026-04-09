"use client";
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

export default function TournamentBoard() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('carrom');

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

  if (loading) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <div className="mono neon-text flicker">SYNCHRONIZING_TOURNAMENT_FEED...</div>
    </div>
  );

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

  const currentRounds = getRounds(selectedTab);

  const MatchCard = ({ match }) => (
    <div className="glass-panel" style={{ 
      padding: '12px', 
      minWidth: '220px', 
      width: '100%',
      borderLeft: `3px solid ${match.status === 'completed' ? 'var(--primary)' : 'var(--secondary)'}`, 
      marginBottom: '10px',
      background: match.status === 'completed' ? 'rgba(0, 255, 65, 0.02)' : 'rgba(0, 229, 255, 0.02)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span className="mono" style={{ fontSize: '0.55rem', opacity: 0.4 }}>{match.status.toUpperCase()}</span>
        {match.round && <span className="mono" style={{ fontSize: '0.55rem', opacity: 0.3 }}># {match.id.split('_')[1]?.slice(-4)}</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {match.players.map((p, idx) => {
          const isWinner = match.winner?.id === p.id;
          const isLoser = match.status === 'completed' && !isWinner;
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: isLoser ? 0.3 : 1 }}>
              <img src={p.photo} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%', border: isWinner ? '1.5px solid var(--primary)' : '1px solid var(--glass-border)' }} />
              <div className="mono" style={{ fontSize: '0.7rem', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {p.name}
              </div>
              {isWinner && <span style={{ fontSize: '10px' }}>👑</span>}
            </div>
          );
        })}
      </div>
    </div>
  );

  const RoundColumn = ({ round, color }) => (
    <div style={{ minWidth: '260px', flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
      <div className="mono" style={{ 
        color: color, 
        fontSize: '0.8rem', 
        marginBottom: '1.2rem', 
        fontWeight: 'bold',
        padding: '4px 12px',
        borderBottom: `1px solid ${color}`,
        width: '100%',
        textAlign: 'center'
      }}>
        &gt; {round.name.toUpperCase()}
      </div>
      <div style={{ width: '100%', maxWidth: '300px' }}>
        {round.matches.map(m => <MatchCard key={m.id} match={m} />)}
      </div>
    </div>
  );

  return (
    <div style={{ width: '100%', maxWidth: '100vw' }}>
      
      {/* Game Type Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '3rem' }}>
        <button 
          onClick={() => setSelectedTab('carrom')}
          style={{ 
            flex: 1, 
            maxWidth: '200px',
            background: selectedTab === 'carrom' ? 'var(--primary)' : 'transparent',
            color: selectedTab === 'carrom' ? 'black' : 'var(--primary)',
            borderColor: 'var(--primary)',
            fontSize: '0.8rem'
          }}
        >
          [ CARROM ]
        </button>
        <button 
          onClick={() => setSelectedTab('ludo')}
          style={{ 
            flex: 1, 
            maxWidth: '200px',
            background: selectedTab === 'ludo' ? 'var(--secondary)' : 'transparent',
            color: selectedTab === 'ludo' ? 'black' : 'var(--secondary)',
            borderColor: 'var(--secondary)',
            fontSize: '0.8rem'
          }}
        >
          [ LUDO ]
        </button>
      </div>

      {/* Brackets Area */}
      <div className="responsive-flex" style={{ display: 'flex', gap: '2rem', justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {currentRounds.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', width: '100%' }}>
            <p className="mono" style={{ opacity: 0.5 }}>NO_ACTIVE_MATCHES_DETECTED</p>
            <p className="mono" style={{ fontSize: '0.6rem', opacity: 0.3, marginTop: '1rem' }}>STAY_TUNED_FOR_ALLOCATIONS</p>
          </div>
        ) : (
          currentRounds.map((r, i) => (
            <React.Fragment key={r.name}>
              <RoundColumn round={r} color={selectedTab === 'carrom' ? 'var(--primary)' : 'var(--secondary)'} />
              {/* Optional Connector - Hidden on mobile via responsive-flex behavior */}
              {i < currentRounds.length - 1 && (
                <div className="mono" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  opacity: 0.2, 
                  height: '100px',
                  alignSelf: 'center',
                  fontSize: '1.5rem',
                  padding: '0 10px',
                  display: typeof window !== 'undefined' && window.innerWidth < 768 ? 'none' : 'flex'
                }}>
                  &gt;&gt;
                </div>
              )}
            </React.Fragment>
          ))
        )}
      </div>

    </div>
  );
}
