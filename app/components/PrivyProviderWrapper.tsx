'use client';
import { PrivyProvider } from '@privy-io/react-auth';

export function PrivyProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'clq8ry4lf00yndl0fm8icglgs'}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#7c3aed',
          logo: 'https://canvas-demo.vercel.app/favicon.ico',
        },
        loginMethods: ['email', 'google', 'wallet'],
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
