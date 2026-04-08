import React from 'react';
import { Link } from 'react-router-dom';

export default function CommunityPage() {
  return (
    <div className="lp-root" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'white', background: '#131722' }}>
      <h1 style={{ fontSize: 32, marginBottom: 12 }}>Community</h1>
      <p style={{ color: '#787B86' }}>Connect with traders. This section is currently under development.</p>
      <Link to="/" style={{ color: '#2962FF', marginTop: 24, textDecoration: 'none', fontWeight: 600 }}>← Back to Home</Link>
    </div>
  );
}
