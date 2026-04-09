"use client";
import React from 'react';

export default function MissionBriefing({ isOpen, onClose }) {
  if (!isOpen) return null;

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
          maxHeight: '90vh',
          padding: '3rem', 
          position: 'relative',
          borderTop: '4px solid var(--secondary)',
          boxShadow: '0 0 40px rgba(0, 229, 255, 0.2)',
          overflowY: 'auto'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div 
          onClick={onClose}
          style={{ 
            position: 'absolute', 
            top: '20px', 
            right: '20px', 
            cursor: 'pointer', 
            color: 'var(--secondary)', 
            fontFamily: 'var(--font-mono)',
            fontSize: '1.2rem',
            zIndex: 1
          }}
        >
          [X]
        </div>

        <h2 className="neon-text flicker" style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: 'var(--secondary)', textShadow: '0 0 10px var(--secondary)' }}>
          RULES
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
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
                <span className="mono" style={{ fontSize: '0.95rem' }}>ANSWERS ARE CASE INSENSITIVE (E.G. FADE & fade ARE THE SAME).</span>
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
                  width: '120px', 
                  height: '120px', 
                  background: '#000', 
                  borderRadius: '4px', 
                  border: '1px solid var(--secondary)', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '5px',
                  padding: '10px',
                  boxShadow: 'inset 0 0 15px rgba(0, 229, 255, 0.2)',
                  flexShrink: 0
                }}>
                   <span className="mono" style={{ color: 'var(--secondary)', fontSize: '0.8rem', opacity: 0.6 }}>// PUZZLE_IMAGE</span>
                   <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white', letterSpacing: '2px', textAlign: 'center' }}>
                      X E D O<br/>C E D
                   </div>
                </div>
                <div style={{ flex: 1, width: '100%' }}>
                  <div className="mono" style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '8px' }}>&gt; TASK: DECODE THE IMAGE</div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '4px', border: '1px solid var(--glass-border)' }}>
                    <div className="mono" style={{ fontSize: '0.6rem', opacity: 0.4, marginBottom: '4px' }}>CORRECT_ANSWER:</div>
                    <div className="mono neon-text" style={{ fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '1px' }}>DECODEX</div>
                  </div>
                  <div className="mono" style={{ fontSize: '0.6rem', opacity: 0.4, marginTop: '12px', lineHeight: '1.4' }}>
                    NOTE ABOUT CASE: <br/>
                    "decodex", "Decodex", and "DECODEX" are all accepted.
                  </div>
                </div>
              </div>
            </div>
          </section>

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
        
        <div className="mono" style={{ position: 'sticky', bottom: '-20px', right: '0', fontSize: '0.6rem', opacity: 0.2, textAlign: 'right', marginTop: '1rem' }}>
          DOC_ID: BRF_7749_X
        </div>
      </div>
    </div>
  );
}
