'use client';
import { usePrivy } from '@privy-io/react-auth';
import { useState } from 'react';
import { UserSettingsModal } from './UserSettingsModal';

interface AuthButtonProps {
  isMobile?: boolean;
}

export function AuthButton({ isMobile }: AuthButtonProps) {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [showSettings, setShowSettings] = useState(false);

  if (!ready) {
    return (
      <div style={{
        fontSize: 12.5, padding: '6px 14px', borderRadius: 6,
        background: '#1a1a2e', color: '#4c1d95', border: '1px solid #2e1065',
        minWidth: 80, textAlign: 'center',
      }}>
        ···
      </div>
    );
  }

  if (authenticated && user) {
    // Derive display name: username from profile → wallet short → email
    const profile = (user as any).profile as Record<string, string> | undefined;
    const username = profile?.username;
    const wallet = user.wallet?.address;
    const email = user.email?.address;
    const google = user.google?.email;

    const displayName = username
      || (wallet ? `${wallet.slice(0, 5)}…${wallet.slice(-4)}` : null)
      || (email ? email.split('@')[0] : null)
      || (google ? google.split('@')[0] : null)
      || 'Player';

    return (
      <>
        <button
          onClick={() => setShowSettings(true)}
          style={{
            fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6,
            background: '#0f1a0f', border: '1px solid #166534',
            borderRadius: 6, padding: '5px 12px', cursor: 'pointer',
            color: '#22c55e', fontFamily: 'inherit',
          }}
        >
          <div style={{ width: 6, height: 6, background: '#22c55e', borderRadius: '50%', flexShrink: 0 }} />
          <span style={{ maxWidth: isMobile ? 80 : 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </span>
          <span style={{ fontSize: 10, opacity: 0.6 }}>⚙</span>
        </button>
        {showSettings && (
          <UserSettingsModal onClose={() => setShowSettings(false)} />
        )}
      </>
    );
  }

  return (
    <button
      onClick={login}
      style={{
        fontSize: 12.5, padding: '6px 14px', borderRadius: 6,
        fontFamily: 'inherit', cursor: 'pointer',
        background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
        color: '#fff', border: 'none',
      }}
    >
      Connect
    </button>
  );
}
