'use client';
import { usePrivy, useLinkAccount } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';

interface Props {
  onClose: () => void;
}

export function UserSettingsModal({ onClose }: Props) {
  const { user, logout, linkEmail, linkGoogle, linkWallet, unlinkEmail, unlinkWallet } = usePrivy();
  const [username, setUsername] = useState('');
  const [xHandle, setXHandle] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load saved profile from localStorage (backend would be a real API)
  useEffect(() => {
    const profile = localStorage.getItem('canvas_profile');
    if (profile) {
      try {
        const p = JSON.parse(profile);
        setUsername(p.username || '');
        setXHandle(p.xHandle || '');
      } catch {}
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    // Save to localStorage (replace with API call in production)
    localStorage.setItem('canvas_profile', JSON.stringify({ username, xHandle }));
    await new Promise(r => setTimeout(r, 400));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const wallet = user?.wallet?.address;
  const email = user?.email?.address;
  const google = user?.google?.email;

  const inputStyle = {
    width: '100%', background: '#0d0d1a', border: '1px solid #2e1065',
    borderRadius: 6, padding: '8px 12px', color: '#e2e8f0',
    fontSize: 13, fontFamily: "'Share Tech Mono', monospace",
    outline: 'none', boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    fontSize: 11, color: '#64748b', letterSpacing: 1, marginBottom: 5, display: 'block',
  };

  const sectionStyle = {
    marginBottom: 20,
  };

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
          <label style={labelStyle}>USERNAME</label>
          <input
            style={inputStyle}
            value={username}
            onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20))}
            placeholder="CanvasNinja"
            maxLength={20}
          />
          <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>Letters, numbers, underscores. Max 20 chars.</div>
        </div>

        {/* X / Twitter */}
        <div style={sectionStyle}>
          <label style={labelStyle}>X (TWITTER) HANDLE</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: 13 }}>@</span>
            <input
              style={{ ...inputStyle, paddingLeft: 26 }}
              value={xHandle}
              onChange={e => setXHandle(e.target.value.replace(/[@\s]/g, '').slice(0, 30))}
              placeholder="yourhandle"
              maxLength={30}
            />
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid #1e1e3f', margin: '20px 0' }} />

        {/* Connected Accounts */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', letterSpacing: 1, marginBottom: 12 }}>CONNECTED ACCOUNTS</div>

          {/* Wallet */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>🔗</span>
              <div>
                <div style={{ fontSize: 12, color: '#e2e8f0' }}>Wallet</div>
                <div style={{ fontSize: 11, color: '#64748b', fontFamily: "'Share Tech Mono', monospace" }}>
                  {wallet ? `${wallet.slice(0, 8)}…${wallet.slice(-6)}` : 'Not connected'}
                </div>
              </div>
            </div>
            {!wallet ? (
              <button
                onClick={linkWallet}
                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 5, background: '#1e0a3c', border: '1px solid #7c3aed', color: '#a78bfa', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Connect
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 6, height: 6, background: '#22c55e', borderRadius: '50%' }} />
                <span style={{ fontSize: 11, color: '#22c55e' }}>Active</span>
              </div>
            )}
          </div>

          {/* Email */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>✉️</span>
              <div>
                <div style={{ fontSize: 12, color: '#e2e8f0' }}>Email</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{email || 'Not connected'}</div>
              </div>
            </div>
            {!email && (
              <button
                onClick={linkEmail}
                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 5, background: '#1e0a3c', border: '1px solid #7c3aed', color: '#a78bfa', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Link
              </button>
            )}
          </div>

          {/* Google */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>G</span>
              <div>
                <div style={{ fontSize: 12, color: '#e2e8f0' }}>Google</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{google || 'Not connected'}</div>
              </div>
            </div>
            {!google && (
              <button
                onClick={linkGoogle}
                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 5, background: '#1e0a3c', border: '1px solid #7c3aed', color: '#a78bfa', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Link
              </button>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid #1e1e3f', margin: '20px 0' }} />

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={logout}
            style={{
              fontSize: 12, padding: '7px 14px', borderRadius: 6,
              background: 'none', border: '1px solid #450a0a', color: '#f87171',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Disconnect
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              fontSize: 12.5, padding: '8px 20px', borderRadius: 6,
              background: saved ? '#166534' : 'linear-gradient(135deg,#7c3aed,#a855f7)',
              color: '#fff', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: 'bold',
              transition: 'background 0.2s',
            }}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
