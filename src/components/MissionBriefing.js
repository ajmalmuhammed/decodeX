"use client";
import React, { useState } from 'react';

export default function MissionBriefing({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('decodex');
  
  if (!isOpen) return null;

  const tabs = [
    { id: 'decodex', label: 'DECODEX' },
    { id: 'carrom', label: 'CARROM' },
    { id: 'ludo', label: 'LUDO' }
  ];

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        background: 'rgba(0,0,0,0.85)', 
        backdropFilter: 'blur(10px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        className="glass-panel" 
        style={{ 
          maxWidth: '600px', 
          width: '100%', 
          maxHeight: '95vh',
          padding: '2rem 2rem 3rem 2rem', 
          position: 'relative',
          borderTop: '4px solid var(--secondary)',
          boxShadow: '0 0 40px rgba(0, 229, 255, 0.2)',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div 
          onClick={onClose}
          style={{ 
            position: 'absolute', 
            top: '20px', 
            right: '25px', 
            cursor: 'pointer', 
            color: 'var(--secondary)', 
            fontFamily: 'var(--font-mono)',
            fontSize: '1.2rem',
            zIndex: 10
          }}
        >
          [X]
        </div>

        <h2 className="neon-text flicker" style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: 'var(--secondary)', textShadow: '0 0 10px var(--secondary)' }}>
          RULES
        </h2>

        {/* Tab Navigation */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '2rem', 
          borderBottom: '1px solid var(--glass-border)',
          paddingBottom: '10px',
          overflowX: 'auto'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? 'rgba(0, 229, 255, 0.1)' : 'transparent',
                border: '1px solid',
                borderColor: activeTab === tab.id ? 'var(--secondary)' : 'rgba(255,255,255,0.1)',
                color: activeTab === tab.id ? 'var(--secondary)' : 'rgba(255,255,255,0.4)',
                padding: '8px 16px',
                fontSize: '0.7rem',
                minWidth: '100px',
                transition: 'all 0.3s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '2rem',
          overflowY: 'auto',
          paddingRight: '10px'
        }}>
          
          {activeTab === 'decodex' && (
            <>
              <div style={{ padding: '5px 12px', background: 'rgba(0, 229, 255, 0.1)', borderLeft: '3px solid var(--secondary)', marginBottom: '1rem' }}>
                <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--secondary)' }}>CORE_MISSION_OBJECTIVES</span>
              </div>

              <section>
                <h3 className="mono" style={{ fontSize: '0.9rem', color: 'var(--secondary)', marginBottom: '0.8rem', opacity: 0.8 }}>
                  &gt; OBJECTIVE
                </h3>
                <p className="mono" style={{ fontSize: '1rem', lineHeight: '1.6' }}>
                  DECODE THE VISUAL DATA PROVIDED IN THE CHAMBER. ACCURACY AND SPEED ARE PARAMOUNT.
                </p>
              </section>

              <section>
                <h3 className="mono" style={{ fontSize: '0.9rem', color: 'var(--secondary)', marginBottom: '0.8rem', opacity: 0.8 }}>
                  &gt; OPERATIONAL_RULES
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <li style={{ display: 'flex', gap: '15px' }}>
                    <span style={{ color: 'var(--secondary)' }}>[01]</span>
                    <span className="mono" style={{ fontSize: '0.95rem' }}>ADMIN IS ALWAYS RIGHT.</span>
                  </li>
                  <li style={{ display: 'flex', gap: '15px' }}>
                    <span style={{ color: 'var(--secondary)' }}>[02]</span>
                    <span className="mono" style={{ fontSize: '0.95rem' }}>ANSWERS ARE CASE INSENSITIVE.</span>
                  </li>
                  <li style={{ display: 'flex', gap: '15px' }}>
                    <span style={{ color: 'var(--secondary)' }}>[03]</span>
                    <span className="mono" style={{ fontSize: '0.95rem' }}>LEVEL PROGRESSION IS SECURED IN REAL-TIME.</span>
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="mono" style={{ fontSize: '0.9rem', color: 'var(--secondary)', marginBottom: '1.2rem', opacity: 0.8 }}>
                  &gt; SAMPLE_QUESTION
                </h3>
                <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', borderStyle: 'dashed' }}>
                  <div className="responsive-flex" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <div style={{ 
                      width: '100px', 
                      height: '100px', 
                      background: '#000', 
                      borderRadius: '4px', 
                      border: '1px solid var(--secondary)', 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '5px',
                      padding: '10px',
                      flexShrink: 0
                    }}>
                       <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white', letterSpacing: '2px', textAlign: 'center' }}>
                          X E D O<br/>C E D
                       </div>
                    </div>
                    <div style={{ flex: 1, width: '100%' }}>
                      <div className="mono" style={{ fontSize: '0.6rem', opacity: 0.4, marginBottom: '4px' }}>ANALYSIS: DECODEX (CASE_INSENSITIVE)</div>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === 'carrom' && (
            <>
              <div style={{ padding: '5px 12px', background: 'rgba(0, 229, 255, 0.1)', borderLeft: '3px solid var(--secondary)', marginBottom: '1rem' }}>
                <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--secondary)' }}>TOURNAMENT_CARROM_POOL</span>
              </div>

              <section>
                <h3 className="mono" style={{ fontSize: '0.9rem', color: 'var(--secondary)', marginBottom: '1rem', opacity: 0.8 }}>
                  &gt; CARROM_POOL_1V1
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <li style={{ display: 'flex', gap: '15px' }}>
                    <span style={{ color: 'var(--secondary)' }}>[01]</span>
                    <span className="mono" style={{ fontSize: '0.95rem' }}>
                      <span style={{ color: 'var(--secondary)' }}>FORMAT:</span> BEST OF 3. WIN 2 GAMES TO PROGRESS.
                    </span>
                  </li>
                  <li style={{ display: 'flex', gap: '15px' }}>
                    <span style={{ color: 'var(--secondary)' }}>[02]</span>
                    <span className="mono" style={{ fontSize: '0.95rem' }}>
                      <span style={{ color: 'var(--secondary)' }}>SETUP:</span> USE "CARROM POOL: DISC GAME" (MINICLIP).
                    </span>
                  </li>
                  <li style={{ display: 'flex', gap: '15px' }}>
                    <span style={{ color: 'var(--secondary)' }}>[03]</span>
                    <span className="mono" style={{ fontSize: '0.95rem' }}>
                      <span style={{ color: 'var(--secondary)' }}>PROTOCOL:</span> DEFAULT COINS ONLY. NO POWER-UPS.
                    </span>
                  </li>
                </ul>
              </section>
            </>
          )}

          {activeTab === 'ludo' && (
            <>
              <div style={{ padding: '5px 12px', background: 'rgba(0, 229, 255, 0.1)', borderLeft: '3px solid var(--secondary)', marginBottom: '1rem' }}>
                <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--secondary)' }}>TOURNAMENT_LUDO_KING</span>
              </div>

              <section>
                <h3 className="mono" style={{ fontSize: '0.9rem', color: 'var(--secondary)', marginBottom: '1rem', opacity: 0.8 }}>
                  &gt; LUDO_4_PLAYER
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <li style={{ display: 'flex', gap: '15px' }}>
                    <span style={{ color: 'var(--secondary)' }}>[01]</span>
                    <span className="mono" style={{ fontSize: '0.95rem' }}>
                      <span style={{ color: 'var(--secondary)' }}>FORMAT:</span> SINGLE-ELIMINATION. WINNER PROGRESSES.
                    </span>
                  </li>
                  <li style={{ display: 'flex', gap: '15px' }}>
                    <span style={{ color: 'var(--secondary)' }}>[02]</span>
                    <span className="mono" style={{ fontSize: '0.95rem' }}>
                      <span style={{ color: 'var(--secondary)' }}>SETUP:</span> USE "LUDO KING". 4-PLAYER CLASSIC.
                    </span>
                  </li>
                  <li style={{ display: 'flex', gap: '15px' }}>
                    <span style={{ color: 'var(--secondary)' }}>[03]</span>
                    <span className="mono" style={{ fontSize: '0.95rem' }}>
                      <span style={{ color: 'var(--secondary)' }}>VICTORY:</span> ALL 4 TOKENS HOME WINS. PROOF REQUIRED.
                    </span>
                  </li>
                </ul>
              </section>
            </>
          )}

          <button 
            onClick={onClose} 
            style={{ 
              marginTop: '1rem', 
              width: '100%', 
              borderColor: 'var(--secondary)', 
              color: 'var(--secondary)',
              flexShrink: 0
            }}
          >
            ACKNOWLEDGE_MISSION
          </button>

        </div>
        
        <div className="mono" style={{ position: 'absolute', bottom: '10px', right: '20px', fontSize: '0.6rem', opacity: 0.2, textAlign: 'right' }}>
          DOC_ID: BRF_7749_X
        </div>
      </div>
    </div>
  );
}
