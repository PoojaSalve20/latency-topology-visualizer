'use client';
import React from 'react';

type Props = { isMobile?: boolean };

export default function Legend({ isMobile = false }: Props) {
  return (
    <div style={{
      position: 'absolute',
      left: isMobile ? 10 : 20,
      bottom: isMobile ? 10 : 60,
      background: 'rgba(0,0,0,0.75)',
      padding: isMobile ? 8 : 12,
      borderRadius: 8,
      border: '1px solid rgba(0,230,255,0.2)',
      color: '#fff',
      fontSize: isMobile ? '11px' : '13px',
      zIndex: 40,
    }}>
      <div style={{ color: '#00e6ff', fontWeight: 700, marginBottom: 8 }}>Legend</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><div style={{ color: '#ff9900' }}>●</div><div>AWS</div></div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><div style={{ color: '#008ad7' }}>●</div><div>Azure</div></div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><div style={{ color: '#4285f4' }}>●</div><div>GCP</div></div>
      <div style={{ marginTop: 8, color: '#00e6ff', fontWeight: 700 }}>Latency</div>
      <div style={{ display: 'flex', gap: 8 }}><div style={{ color: '#00ff00' }}>━</div><div>Low &lt; 60ms</div></div>
      <div style={{ display: 'flex', gap: 8 }}><div style={{ color: '#ffff00' }}>━</div><div>Medium 60-150ms</div></div>
      <div style={{ display: 'flex', gap: 8 }}><div style={{ color: '#ff0000' }}>━</div><div>High &gt; 150ms</div></div>
    </div>
  );
}