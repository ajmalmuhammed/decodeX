"use client";
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

export default function TournamentBoard() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('carrom');
  const [selectedRound, setSelectedRound] = useState('all');

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
    
    // Get unique round names for the tab bar
    const allRoundNames = Object.keys(grouped).sort();
    
    // Prepare rounds for display (filtered by selectedRound)
    const displayRounds = allRoundNames
      .filter(r => selectedRound === 'all' || r === selectedRound)
      .map(r => ({ name: r, matches: grouped[r] }));

    return { displayRounds, allRoundNames };
  };

  const { displayRounds, allRoundNames } = getRounds(selectedTab);

  const MatchCard = ({ match }) => (
    <div className="glass-panel" style={{ 
      padding: '10px', 
      minWidth: '200px', 
      width: '100%',
      borderLeft: `3px solid ${match.status === 'completed' ? 'var(--primary)' : 'var(--secondary)'}`, 
      marginBottom: '10px',
      background: match.status === 'completed' ? 'rgba(0, 255, 65, 0.02)' : 'rgba(0, 229, 255, 0.02)',
      boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span className="mono" style={{ fontSize: '0.5rem', opacity: 0.4 }}>{match.status.toUpperCase()}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {match.players.map((p, idx) => {
          const isWinner = match.winner?.id === p.id;
          const isLoser = match.status === 'completed' && !isWinner;
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: isLoser ? 0.3 : 1 }}>
              <img src={p.photo} alt="" style={{ width: '18px', height: '18px', borderRadius: '50%', border: isWinner ? '1.5px solid var(--primary)' : '1px solid var(--glass-border)' }} />
              <div className="mono" style={{ fontSize: '0.65rem', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
    <div style={{ minWidth: '240px', maxWidth: '300px', flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem', width: '100%' }}>
      <div className="mono" style={{ 
        color: color, 
        fontSize: '0.75rem', 
        marginBottom: '1rem', 
        fontWeight: 'bold',
        padding: '4px 12px',
        borderBottom: `1px solid ${color}`,
        width: '100%',
        textAlign: 'center'
      }}>
        &gt; {round.name.toUpperCase()}
      </div>
      <div style={{ width: '100%' }}>
        {round.matches.map(m => <MatchCard key={m.id} match={m} />)}
      </div>
    </div>
  );

  return (
    <div style={{ width: '100%', maxWidth: '100%' }}>
      
      {/* Game Type Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem', width: '100%' }}>
        <button 
          onClick={() => { setSelectedTab('carrom'); setSelectedRound('all'); }}
          style={{ 
            flex: 1, 
            background: selectedTab === 'carrom' ? 'var(--primary)' : 'transparent',
            color: selectedTab === 'carrom' ? 'black' : 'var(--primary)',
            borderColor: 'var(--primary)',
            padding: '8px 4px',
            fontSize: '0.75rem',
            fontWeight: 'bold'
          }}
        >
          [ CARROM ]
        </button>
        <button 
          onClick={() => { setSelectedTab('ludo'); setSelectedRound('all'); }}
          style={{ 
            flex: 1, 
            background: selectedTab === 'ludo' ? 'var(--secondary)' : 'transparent',
            color: selectedTab === 'ludo' ? 'black' : 'var(--secondary)',
            borderColor: 'var(--secondary)',
            padding: '8px 4px',
            fontSize: '0.75rem',
            fontWeight: 'bold'
          }}
        >
          [ LUDO ]
        </button>
      </div>

      {/* Round Sub-Tabs */}
      {allRoundNames.length > 0 && (
        <div className="mono" style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '2.5rem', 
          overflowX: 'auto', 
          paddingBottom: '12px',
          borderBottom: '1px solid var(--glass-border)',
          justifyContent: allRoundNames.length < 4 ? 'center' : 'flex-start'
        }}>
          <button
            onClick={() => setSelectedRound('all')}
            style={{
              padding: '4px 12px',
              fontSize: '0.6rem',
              background: selectedRound === 'all' ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: '1px solid',
              borderColor: selectedRound === 'all' ? 'white' : 'rgba(255,255,255,0.2)',
              color: selectedRound === 'all' ? 'white' : 'rgba(255,255,255,0.5)',
              whiteSpace: 'nowrap'
            }}
          >
            [ ALL_ROUNDS ]
          </button>
          {allRoundNames.map(r => (
            <button
              key={r}
              onClick={() => setSelectedRound(r)}
              style={{
                padding: '4px 12px',
                fontSize: '0.6rem',
                background: selectedRound === r ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: '1px solid',
                borderColor: selectedRound === r ? (selectedTab === 'carrom' ? 'var(--primary)' : 'var(--secondary)') : 'rgba(255,255,255,0.2)',
                color: selectedRound === r ? (selectedTab === 'carrom' ? 'var(--primary)' : 'var(--secondary)') : 'rgba(255,255,255,0.5)',
                whiteSpace: 'nowrap'
              }}
            >
              [ {r.toUpperCase()} ]
            </button>
          ))}
        </div>
      )}

      {/* Brackets Area */}
      <div className="responsive-flex" style={{ display: 'flex', gap: '2rem', justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {displayRounds.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', width: '100%' }}>
            <p className="mono" style={{ opacity: 0.5 }}>NO_ACTIVE_MATCHES_DETECTED</p>
            <p className="mono" style={{ fontSize: '0.6rem', opacity: 0.3, marginTop: '1rem' }}>STAY_TUNED_FOR_ALLOCATIONS</p>
          </div>
        ) : (
          displayRounds.map((r, i) => (
            <React.Fragment key={r.name}>
              <RoundColumn round={r} color={selectedTab === 'carrom' ? 'var(--primary)' : 'var(--secondary)'} />
              {/* Optional Connector - Hidden on mobile or if single round viewed */}
              {i < displayRounds.length - 1 && selectedRound === 'all' && (
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
