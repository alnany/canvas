'use client';
import { usePrivy } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';

interface Props {
  onClose: () => void;
}

export function UserSettingsModal({ onClose }: Props) {
  const { user, logout } = usePrivy();
  const [username, setUsername] = useState('');
  const [xHandle, setXHandle] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem('canvas_profile') || '{}');
      setUsername(p.username || '');
      setXHandle(p.xHandle || '');
    } catch {}
  }, []);

  const handleSave = async () => {
    setSaving(true);
    localStorage.setItem('canvas_profile', JSON.stringify({ username, xHandle }));
    await new Promise(r => setTimeout(r, 400));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const wallet = user?.wallet?.address;
  const email  = user?.email?.address;
  const google = user?.google?.email;

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#0d0d1a', border: '1px solid #2e1065',
    borderRadius: 6, padding: '8px 12px', color: '#e2e8f0',
    fontSize: 13, fontFamily: "'Share Tech Mono', monospace",
    outline: 'none', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11, color: '#64748b', letterSpacing: 1, marginBottom: 5, display: 'block',
  };

  const sectionStyle: React.CSSProperties = { marginBottom: 20 };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0a0a18', border: '1px solid #2e1065', borderRadius: 12,
          width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto',
          padding: 28,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 'bold', color: '#e2e8f0', letterSpacing: 1 }}>Profile Settings</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>Customize your Canvas identity</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20, padding: 4 }}
          >
            ✕
          </button>
        </div>

        {/* Username */}
        <div style={sectionStyle}>
          <label style={labelStyle}>CANVAS USERNAME</label>
          <input
            style={inputStyle}
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="e.g. PixelKing"
            maxLength={20}
          />
          <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>
            Shown on the grid and leaderboard
          </div>
        </div>

        {/* X Handle */}
        <div style={sectionStyle}>
          <label style={labelStyle}>X (TWITTER) HANDLE</label>
          <input
            style={inputStyle}
            value={xHandle}
            onChange={e => setXHandle(e.target.value)}
            placeholder="@yourhandle"
            maxLength={30}
          />
        </div>

        {/* Linked accounts (read-only display) */}
        <div style={sectionStyle}>
          <label style={labelStyle}>LINKED ACCOUNTS</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {email && (
              <div style={{ fontSize: 12, color: '#94a3b8', padding: '6px 10px', background: '#111827', borderRadius: 6, border: '1px solid #1e293b' }}>
                ✉ {email}
              </div>
            )}
            {google && (
              <div style={{ fontSize: 12, color: '#94a3b8', padding: '6px 10px', background: '#111827', borderRadius: 6, border: '1px solid #1e293b' }}>
                G {google}
              </div>
            )}
            {wallet && (
              <div style={{ fontSize: 12, color: '#94a3b8', padding: '6px 10px', background: '#111827', borderRadius: 6, border: '1px solid #1e293b', fontFamily: 'monospace' }}>
                ◎ {wallet.slice(0, 6)}…{wallet.slice(-4)}
              </div>
            )}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 8,
            background: saved ? '#166534' : 'linear-gradient(135deg,#7c3aed,#a855f7)',
            color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: 13, letterSpacing: 1, marginBottom: 12,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saved ? '✓ SAVED' : saving ? 'SAVING…' : 'SAVE PROFILE'}
        </button>

        {/* Logout */}
        <button
          onClick={() => { logout(); onClose(); }}
          style={{
            width: '100%', padding: '8px 0', borderRadius: 8,
            background: 'transparent', color: '#ef4444',
            border: '1px solid #7f1d1d', cursor: 'pointer',
            fontSize: 12, letterSpacing: 1,
          }}
        >
          DISCONNECT
        </button>
      </div>
    </div>
  );
}
