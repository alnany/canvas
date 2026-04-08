'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CanvasLogo } from '../components/CanvasLogo';
import {
  AFFILIATE_POOL, DIRECT_BONUS, MAX_DEPTH,
  validateDownlineRate, getRateSummary, generateReferralCode,
  type Affiliate, type DownlineMember, type EarningRecord,
} from '@/lib/affiliate';

// ─── Mock data for UI preview (dev: replace with API calls) ──────────────────

const MOCK_WALLET = 'You (0x7f4…a9c)';
const MOCK_REF_CODE = 'CNVS42';

const MOCK_AFFILIATE: Affiliate = {
  id: MOCK_WALLET,
  referralCode: MOCK_REF_CODE,
  referrerId: null,
  maxRate: AFFILIATE_POOL,
  downlineDefaultRate: 3,
  totalEarned: 182.40,
  totalClaimed: 135.00,
  createdAt: '2026-03-01T00:00:00Z',
};

const MOCK_DOWNLINES: DownlineMember[] = [
  { affiliate: { id: '@alice_sol', referralCode: 'A1', referrerId: MOCK_WALLET, maxRate: 3, downlineDefaultRate: 1.5, totalEarned: 44.20, totalClaimed: 22.10, createdAt: '2026-03-05T00:00:00Z' }, effectiveRate: 3, spendVolume: 1474, earnings: 44.20, subCount: 4 },
  { affiliate: { id: '@bob_xyz', referralCode: 'B2', referrerId: MOCK_WALLET, maxRate: 3, downlineDefaultRate: 0, totalEarned: 18.60, totalClaimed: 18.60, createdAt: '2026-03-10T00:00:00Z' }, effectiveRate: 3, spendVolume: 620, earnings: 18.60, subCount: 0 },
  { affiliate: { id: '@carol_gg', referralCode: 'C3', referrerId: MOCK_WALLET, maxRate: 3, downlineDefaultRate: 2, totalEarned: 31.50, totalClaimed: 0, createdAt: '2026-03-15T00:00:00Z' }, effectiveRate: 3, spendVolume: 1050, earnings: 31.50, subCount: 2 },
  { affiliate: { id: '@dave_px', referralCode: 'D4', referrerId: MOCK_WALLET, maxRate: 3, downlineDefaultRate: 0, totalEarned: 5.10, totalClaimed: 5.10, createdAt: '2026-03-20T00:00:00Z' }, effectiveRate: 3, spendVolume: 170, earnings: 5.10, subCount: 0 },
];

const MOCK_EARNINGS: EarningRecord[] = [
  { id: '1', affiliateId: MOCK_WALLET, playerId: '@alice_sol', purchaseAmount: 50, cascadeEarning: 1.00, directBonus: 2.50, totalEarning: 3.50, purchaseTx: 'tx1', weekBucket: '2026-W15', claimed: false, createdAt: '2026-04-08T10:00:00Z' },
  { id: '2', affiliateId: MOCK_WALLET, playerId: '@bob_xyz', purchaseAmount: 100, cascadeEarning: 2.00, directBonus: 5.00, totalEarning: 7.00, purchaseTx: 'tx2', weekBucket: '2026-W15', claimed: false, createdAt: '2026-04-07T14:30:00Z' },
  { id: '3', affiliateId: MOCK_WALLET, playerId: '@carol_gg', purchaseAmount: 200, cascadeEarning: 4.00, directBonus: 10.00, totalEarning: 14.00, purchaseTx: 'tx3', weekBucket: '2026-W14', claimed: true, claimedAt: '2026-04-01T09:00:00Z', createdAt: '2026-03-31T18:00:00Z' },
  { id: '4', affiliateId: MOCK_WALLET, playerId: '@dave_px', purchaseAmount: 30, cascadeEarning: 0.60, directBonus: 1.50, totalEarning: 2.10, purchaseTx: 'tx4', weekBucket: '2026-W14', claimed: true, claimedAt: '2026-04-01T09:00:00Z', createdAt: '2026-03-30T11:00:00Z' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtUSDT(n: number) { return `$${n.toFixed(2)}`; }

function shortAddr(addr: string) {
  if (addr.startsWith('@')) return addr;
  if (addr.length > 16) return addr.slice(0, 8) + '…' + addr.slice(-4);
  return addr;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 24px', flex: 1, minWidth: 160 }}>
      <div style={{ color: '#64748b', fontSize: 10, fontFamily: 'Share Tech Mono', letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ color: '#f1f5f9', fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>{value}</div>
      {sub && <div style={{ color: '#475569', fontSize: 11, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={copy} style={{ background: copied ? '#16a34a' : 'rgba(99,102,241,0.15)', border: `1px solid ${copied ? '#16a34a' : '#6366f1'}`, color: copied ? '#fff' : '#a5b4fc', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontFamily: 'Share Tech Mono', cursor: 'pointer', transition: 'all 0.2s' }}>
      {copied ? '✓ COPIED' : 'COPY'}
    </button>
  );
}

interface RateSliderProps {
  myMaxRate: number;
  value: number;
  onChange: (v: number) => void;
  onSave: () => void;
  saving: boolean;
}

function RateSlider({ myMaxRate, value, onChange, onSave, saving }: RateSliderProps) {
  const { valid, min, max } = validateDownlineRate(value, myMaxRate);
  const summary = getRateSummary(myMaxRate, value);

  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 15 }}>Default Downline Rate</div>
          <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>How much of your allocation you share with invitees</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#a78bfa', fontSize: 28, fontWeight: 700 }}>{value.toFixed(1)}%</div>
          <div style={{ color: '#64748b', fontSize: 11 }}>of their spend</div>
        </div>
      </div>

      {/* Slider */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <input
          type="range"
          min={0}
          max={myMaxRate}
          step={0.1}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: '#7c3aed', height: 4 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ color: '#475569', fontSize: 11 }}>0%</span>
          {min > 0 && <span style={{ color: '#475569', fontSize: 11 }}>min {min}%</span>}
          <span style={{ color: '#475569', fontSize: 11 }}>{max}%</span>
        </div>
      </div>

      {/* Live preview */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
          <div style={{ color: '#a78bfa', fontSize: 10, letterSpacing: 1, marginBottom: 4 }}>YOU KEEP</div>
          <div style={{ color: '#c4b5fd', fontSize: 20, fontWeight: 700 }}>{summary.iKeep.toFixed(1)}%</div>
        </div>
        <div style={{ flex: 1, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
          <div style={{ color: '#86efac', fontSize: 10, letterSpacing: 1, marginBottom: 4 }}>DOWNLINE GETS</div>
          <div style={{ color: '#4ade80', fontSize: 20, fontWeight: 700 }}>{summary.downlineGets.toFixed(1)}%</div>
        </div>
        <div style={{ flex: 1, background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
          <div style={{ color: '#67e8f9', fontSize: 10, letterSpacing: 1, marginBottom: 4 }}>DIRECT BONUS</div>
          <div style={{ color: '#22d3ee', fontSize: 20, fontWeight: 700 }}>+{DIRECT_BONUS}%</div>
        </div>
      </div>

      <div style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.12)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#67e8f9' }}>
        ✦ {summary.directBonusNote}
      </div>

      {!valid && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#fca5a5' }}>
          ⚠ {validateDownlineRate(value, myMaxRate).message}
        </div>
      )}

      <button
        onClick={onSave}
        disabled={!valid || saving}
        style={{ width: '100%', background: valid ? '#7c3aed' : 'rgba(255,255,255,0.05)', color: valid ? '#fff' : '#475569', border: 'none', borderRadius: 8, padding: '12px 0', fontSize: 13, fontFamily: 'Share Tech Mono', cursor: valid ? 'pointer' : 'not-allowed', fontWeight: 600, transition: 'all 0.2s' }}
      >
        {saving ? 'SAVING…' : 'SAVE RATE'}
      </button>
    </div>
  );
}

interface DownlineRowProps {
  member: DownlineMember;
  myMaxRate: number;
  onSetCustomRate: (downlineId: string, rate: number) => void;
}

function DownlineRow({ member, myMaxRate, onSetCustomRate }: DownlineRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [customRate, setCustomRate] = useState(member.effectiveRate);
  const [editing, setEditing] = useState(false);

  const { valid } = validateDownlineRate(customRate, myMaxRate);

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', cursor: 'pointer' }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#a78bfa', fontWeight: 700 }}>
          {member.affiliate.id.slice(1, 3).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 500, fontFamily: 'Share Tech Mono' }}>{shortAddr(member.affiliate.id)}</div>
          <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>
            {member.subCount} sub-affiliates · {fmtUSDT(member.spendVolume)} spend
          </div>
        </div>
        <div style={{ textAlign: 'right', marginRight: 8 }}>
          <div style={{ color: '#4ade80', fontSize: 14, fontWeight: 600 }}>{fmtUSDT(member.earnings)}</div>
          <div style={{ color: '#64748b', fontSize: 11 }}>earned</div>
        </div>
        <div style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 6, padding: '4px 10px', fontSize: 12, color: '#a78bfa', fontFamily: 'Share Tech Mono' }}>
          {member.effectiveRate}%
        </div>
        <div style={{ color: '#475569', fontSize: 16 }}>{expanded ? '▲' : '▼'}</div>
      </div>

      {expanded && (
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: 16, marginBottom: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 12 }}>Set custom rate for this affiliate</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="number"
              min={0}
              max={myMaxRate}
              step={0.1}
              value={customRate}
              onChange={e => { setCustomRate(parseFloat(e.target.value)); setEditing(true); }}
              style={{ width: 80, background: 'rgba(255,255,255,0.05)', border: `1px solid ${valid ? 'rgba(255,255,255,0.1)' : '#ef4444'}`, borderRadius: 6, padding: '6px 10px', color: '#f1f5f9', fontSize: 14, fontFamily: 'Share Tech Mono' }}
            />
            <span style={{ color: '#64748b', fontSize: 12 }}>% (0 – {myMaxRate}%)</span>
            {editing && (
              <button
                disabled={!valid}
                onClick={() => { onSetCustomRate(member.affiliate.id, customRate); setEditing(false); }}
                style={{ background: valid ? '#7c3aed' : 'rgba(255,255,255,0.05)', color: valid ? '#fff' : '#475569', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontFamily: 'Share Tech Mono', cursor: valid ? 'pointer' : 'not-allowed' }}
              >
                SAVE
              </button>
            )}
          </div>
          {member.subCount > 0 && (
            <div style={{ marginTop: 10, color: '#64748b', fontSize: 11 }}>
              ↳ They have {member.subCount} sub-affiliates · rate they can pass down: up to {member.effectiveRate}%
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EarningsTable({ records }: { records: EarningRecord[] }) {
  const grouped = records.reduce<Record<string, EarningRecord[]>>((acc, r) => {
    (acc[r.weekBucket] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div>
      {Object.entries(grouped).map(([week, rows]) => {
        const weekTotal = rows.reduce((s, r) => s + r.totalEarning, 0);
        const claimed = rows.every(r => r.claimed);
        return (
          <div key={week} style={{ marginBottom: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#94a3b8', fontSize: 12, fontFamily: 'Share Tech Mono' }}>{week}</span>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{fmtUSDT(weekTotal)}</span>
                <span style={{ background: claimed ? 'rgba(34,197,94,0.1)' : 'rgba(251,191,36,0.1)', border: `1px solid ${claimed ? 'rgba(34,197,94,0.2)' : 'rgba(251,191,36,0.2)'}`, color: claimed ? '#4ade80' : '#fbbf24', borderRadius: 6, padding: '2px 8px', fontSize: 11 }}>
                  {claimed ? '✓ CLAIMED' : 'PENDING'}
                </span>
              </div>
            </div>
            <div style={{ padding: '8px 0' }}>
              {rows.map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', fontSize: 12 }}>
                  <div style={{ color: '#64748b', fontFamily: 'Share Tech Mono' }}>{shortAddr(r.playerId)}</div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <span style={{ color: '#475569' }}>spend {fmtUSDT(r.purchaseAmount)}</span>
                    {r.directBonus > 0 && <span style={{ color: '#22d3ee' }}>bonus +{fmtUSDT(r.directBonus)}</span>}
                    {r.cascadeEarning > 0 && <span style={{ color: '#a78bfa' }}>cascade +{fmtUSDT(r.cascadeEarning)}</span>}
                    <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{fmtUSDT(r.totalEarning)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RewardsPage() {
  const [affiliate] = useState<Affiliate>(MOCK_AFFILIATE);
  const [downlines] = useState<DownlineMember[]>(MOCK_DOWNLINES);
  const [earnings] = useState<EarningRecord[]>(MOCK_EARNINGS);
  const [downlineRate, setDownlineRate] = useState(affiliate.downlineDefaultRate);
  const [savingRate, setSavingRate] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'downline' | 'history'>('overview');

  const claimable = earnings.filter(r => !r.claimed).reduce((s, r) => s + r.totalEarning, 0);
  const referralUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/play?ref=${affiliate.referralCode}`
    : `/play?ref=${affiliate.referralCode}`;

  const handleSaveRate = useCallback(async () => {
    setSavingRate(true);
    // TODO: await fetch('/api/affiliate/set-rate', { method: 'POST', body: JSON.stringify({ walletAddress: affiliate.id, downlineRate }) })
    await new Promise(r => setTimeout(r, 800));
    setSavingRate(false);
  }, [affiliate.id, downlineRate]);

  const handleClaim = useCallback(async () => {
    if (claimable <= 0) return;
    setClaiming(true);
    // TODO: await fetch('/api/affiliate/claim', { method: 'POST', body: JSON.stringify({ walletAddress: affiliate.id }) })
    await new Promise(r => setTimeout(r, 1200));
    setClaiming(false);
    setClaimSuccess(true);
    setTimeout(() => setClaimSuccess(false), 3000);
  }, [affiliate.id, claimable]);

  const handleSetCustomRate = useCallback(async (downlineId: string, rate: number) => {
    // TODO: await fetch('/api/affiliate/set-rate', { method: 'POST', body: JSON.stringify({ walletAddress: affiliate.id, downlineRate: rate, customFor: downlineId }) })
    console.log('Set custom rate', downlineId, rate);
  }, [affiliate.id]);

  const NAV_TABS = [
    { key: 'overview', label: 'OVERVIEW' },
    { key: 'downline', label: `DOWNLINE (${downlines.length})` },
    { key: 'history', label: 'HISTORY' },
  ] as const;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a12', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <CanvasLogo size={28} />
            </Link>
            <Link href="/play" style={{ color: '#64748b', fontSize: 13, textDecoration: 'none' }}>← Back to Canvas</Link>
          </div>
          <div style={{ fontFamily: 'Press Start 2P', fontSize: 12, color: '#a78bfa', letterSpacing: 1 }}>REWARDS</div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>

        {/* Hero: Stats row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
          <StatCard label="My Rate" value={`${affiliate.maxRate}%`} sub="of referred spend" />
          <StatCard label="All-Time Earned" value={fmtUSDT(affiliate.totalEarned)} sub="USDT" />
          <StatCard label="Claimed" value={fmtUSDT(affiliate.totalClaimed)} sub="USDT sent" />
          <div style={{ background: claimable > 0 ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${claimable > 0 ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, padding: '20px 24px', flex: 1, minWidth: 200 }}>
            <div style={{ color: '#64748b', fontSize: 10, fontFamily: 'Share Tech Mono', letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' }}>Claimable</div>
            <div style={{ color: claimable > 0 ? '#c4b5fd' : '#64748b', fontSize: 28, fontWeight: 700 }}>{fmtUSDT(claimable)}</div>
            <button
              onClick={handleClaim}
              disabled={claimable <= 0 || claiming}
              style={{ marginTop: 12, background: claimable > 0 ? '#7c3aed' : 'rgba(255,255,255,0.05)', color: claimable > 0 ? '#fff' : '#475569', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 12, fontFamily: 'Share Tech Mono', cursor: claimable > 0 ? 'pointer' : 'not-allowed', fontWeight: 600 }}
            >
              {claimSuccess ? '✓ CLAIMED!' : claiming ? 'PROCESSING…' : 'CLAIM USDT'}
            </button>
          </div>
        </div>

        {/* Referral link */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24, marginBottom: 32 }}>
          <div style={{ color: '#94a3b8', fontSize: 11, fontFamily: 'Share Tech Mono', letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>Your Referral Link</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 14px', fontFamily: 'Share Tech Mono', fontSize: 14, color: '#a78bfa', minWidth: 200, wordBreak: 'break-all' }}>
              {referralUrl}
            </div>
            <CopyButton text={referralUrl} />
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 14px', fontFamily: 'Share Tech Mono', fontSize: 14, color: '#64748b', letterSpacing: 2 }}>
              CODE: <span style={{ color: '#f1f5f9' }}>{affiliate.referralCode}</span>
            </div>
          </div>

          {/* Model summary pills */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 20, padding: '4px 12px', fontSize: 11, color: '#a78bfa' }}>
              ↑ {AFFILIATE_POOL}% cascade pool
            </div>
            <div style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)', borderRadius: 20, padding: '4px 12px', fontSize: 11, color: '#22d3ee' }}>
              ✦ {DIRECT_BONUS}% guaranteed direct bonus
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '4px 12px', fontSize: 11, color: '#64748b' }}>
              up to {MAX_DEPTH} levels deep
            </div>
            <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)', borderRadius: 20, padding: '4px 12px', fontSize: 11, color: '#4ade80' }}>
              open to all · USDT payouts
            </div>
          </div>
        </div>

        {/* Tab nav */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 24 }}>
          {NAV_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{ background: 'none', border: 'none', borderBottom: activeTab === tab.key ? '2px solid #7c3aed' : '2px solid transparent', color: activeTab === tab.key ? '#a78bfa' : '#64748b', padding: '10px 20px', fontSize: 11, fontFamily: 'Share Tech Mono', cursor: 'pointer', letterSpacing: 1, transition: 'color 0.2s' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div>
            <RateSlider
              myMaxRate={affiliate.maxRate}
              value={downlineRate}
              onChange={setDownlineRate}
              onSave={handleSaveRate}
              saving={savingRate}
            />

            {/* How it works */}
            <div style={{ marginTop: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 24 }}>
              <div style={{ color: '#94a3b8', fontSize: 11, fontFamily: 'Share Tech Mono', letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>How the Cascade Works</div>
              <div style={{ display: 'flex', gap: 0, alignItems: 'center', flexWrap: 'wrap' }}>
                {[
                  { label: 'Canvas', rate: '100%', keep: '90%', color: '#7c3aed', sub: 'allocates 5% pool' },
                  { label: 'You (L1)', rate: `${affiliate.maxRate}%`, keep: `${(affiliate.maxRate - downlineRate).toFixed(1)}%`, color: '#a78bfa', sub: 'cascade + 5% bonus' },
                  { label: 'Your Invitee', rate: `${downlineRate}%`, keep: `${downlineRate}%`, color: '#22d3ee', sub: 'cascade + 5% bonus' },
                  { label: 'Their Invitee', rate: '…', keep: '…', color: '#64748b', sub: 'up to 15 levels' },
                ].map((node, i) => (
                  <div key={node.label} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ width: 80, background: `${node.color}18`, border: `1px solid ${node.color}40`, borderRadius: 8, padding: '10px 8px' }}>
                        <div style={{ color: node.color, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>{node.label}</div>
                        <div style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 700 }}>{node.keep}</div>
                        <div style={{ color: '#64748b', fontSize: 10, marginTop: 2 }}>{node.sub}</div>
                      </div>
                    </div>
                    {i < 3 && <div style={{ color: '#334155', fontSize: 20, padding: '0 6px' }}>→</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Downline tab */}
        {activeTab === 'downline' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ color: '#94a3b8', fontSize: 13 }}>
                {downlines.length} direct affiliates · click to set custom rates
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '0 20px' }}>
              {downlines.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center', color: '#475569' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
                  <div>No affiliates yet. Share your link to get started.</div>
                </div>
              ) : (
                downlines.map(m => (
                  <DownlineRow
                    key={m.affiliate.id}
                    member={m}
                    myMaxRate={affiliate.maxRate}
                    onSetCustomRate={handleSetCustomRate}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* History tab */}
        {activeTab === 'history' && (
          <div>
            {earnings.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#475569', background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
                <div>No earnings yet. Share your link to start earning.</div>
              </div>
            ) : (
              <EarningsTable records={earnings} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
