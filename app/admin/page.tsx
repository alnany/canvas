'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CanvasLogo } from '../components/CanvasLogo';
import { AFFILIATE_POOL, DIRECT_BONUS, MAX_DEPTH } from '@/lib/affiliate';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GameSettings {
  rtp: number;
  platformFeeRate: number;
  brushTiers: [number, number, number];
  strikeOdds: { common: number; rare: number; legendary: number };
  strikeMultipliers: { common: number; rare: number; legendary: number };
  shieldCostPerPixel: number;
  shieldDurationHours: number;
}

interface AffiliateSettings {
  cascadePool: number;
  directBonus: number;
  maxDepth: number;
  minRateFloor: number;
}

interface AffiliateRow {
  id: string;
  referralCode: string;
  maxRate: number;
  downlineDefaultRate: number;
  totalEarned: number;
  totalClaimed: number;
  volume: number;
  subCount: number;
  createdAt: string;
}

type AdminTab = 'overview' | 'game' | 'affiliate' | 'users';

// ─── Mock platform stats ──────────────────────────────────────────────────────

const MOCK_STATS = {
  totalAffiliates: 284,
  elevatedAffiliates: 8,
  weeklyVolume: 142800,
  weeklyFees: 5712,
  weeklyAffiliatePayout: 1142.4,
  canvasKeeps: 4569.6,
  activeUsers: 3820,
  pixelsPlaced: 918420,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtUSDT(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(2)}`;
}
function fmtNum(n: number) {
  return n >= 1000000 ? `${(n / 1000000).toFixed(2)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 24, marginBottom: 16 }}>
      <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'Share Tech Mono', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 18 }}>{title}</div>
      {children}
    </div>
  );
}

function StatTile({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 20px', flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'Share Tech Mono', letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ color: accent ?? '#f1f5f9', fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>{value}</div>
      {sub && <div style={{ color: '#475569', fontSize: 11, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SettingRow({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div>
        <div style={{ color: '#e2e8f0', fontSize: 13.5 }}>{label}</div>
        {sub && <div style={{ color: '#475569', fontSize: 11, marginTop: 3 }}>{sub}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{children}</div>
    </div>
  );
}

function NumInput({ value, onChange, min, max, step, suffix }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <input
        type="number" value={value} min={min} max={max} step={step ?? 0.1}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        style={{ width: 72, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '7px 10px', color: '#f1f5f9', fontSize: 13, fontFamily: 'Share Tech Mono', outline: 'none', textAlign: 'right' }}
      />
      {suffix && <span style={{ color: '#64748b', fontSize: 12, fontFamily: 'Share Tech Mono' }}>{suffix}</span>}
    </div>
  );
}

function SaveButton({ onClick, saved, disabled }: { onClick: () => void; saved: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ background: saved ? 'rgba(22,163,74,0.2)' : 'rgba(99,102,241,0.15)', border: `1px solid ${saved ? '#16a34a' : '#6366f1'}`, color: saved ? '#4ade80' : '#a5b4fc', borderRadius: 8, padding: '8px 20px', fontSize: 12, fontFamily: 'Share Tech Mono', cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: disabled ? 0.5 : 1 }}
    >
      {saved ? '✓ SAVED' : 'SAVE'}
    </button>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function OverviewTab({ stats }: { stats: typeof MOCK_STATS }) {
  return (
    <div>
      <SectionCard title="This week">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <StatTile label="Paint Volume"   value={fmtUSDT(stats.weeklyVolume)}       sub="USDT total spend"     accent="#22d3ee" />
          <StatTile label="Platform Fees"  value={fmtUSDT(stats.weeklyFees)}         sub="4% of volume"        accent="#a78bfa" />
          <StatTile label="Affiliate Payout" value={fmtUSDT(stats.weeklyAffiliatePayout)} sub="20% of fees"   accent="#f59e0b" />
          <StatTile label="Canvas Keeps"   value={fmtUSDT(stats.canvasKeeps)}        sub="80% of fees"         accent="#4ade80" />
        </div>
      </SectionCard>
      <SectionCard title="Platform">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <StatTile label="Active Players"  value={fmtNum(stats.activeUsers)}    sub="last 7 days" />
          <StatTile label="Pixels Placed"   value={fmtNum(stats.pixelsPlaced)}   sub="all time" />
          <StatTile label="Total Affiliates" value={fmtNum(stats.totalAffiliates)} sub="registered" />
          <StatTile label="Elevated"        value={String(stats.elevatedAffiliates)} sub={`maxRate > ${AFFILIATE_POOL}%`} accent="#f59e0b" />
        </div>
      </SectionCard>
      <SectionCard title="Revenue split (live)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Player RTP',        pct: 96,  color: '#22d3ee', note: 'prize pool' },
            { label: 'Canvas keeps',      pct: 3.2, color: '#4ade80', note: '80% of 4% fee' },
            { label: 'Affiliate cascade', pct: 0.4, color: '#a78bfa', note: '5% cascade pool (of fee)' },
            { label: 'Affiliate direct',  pct: 0.4, color: '#f59e0b', note: '5% direct bonus (of fee)' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 130, color: '#94a3b8', fontSize: 12 }}>{r.label}</div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 4, height: 12, overflow: 'hidden' }}>
                <div style={{ width: `${r.pct}%`, background: r.color, height: '100%', borderRadius: 4 }} />
              </div>
              <div style={{ width: 44, color: r.color, fontSize: 12, fontFamily: 'Share Tech Mono', textAlign: 'right' }}>{r.pct}%</div>
              <div style={{ color: '#475569', fontSize: 11, width: 180 }}>{r.note}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function GameTab() {
  const [s, setS] = useState<GameSettings>({
    rtp: 96, platformFeeRate: 4,
    brushTiers: [1, 10, 100],
    strikeOdds:        { common: 5, rare: 1, legendary: 0.1 },
    strikeMultipliers: { common: 5, rare: 25, legendary: 200 },
    shieldCostPerPixel: 3,
    shieldDurationHours: 8,
  });
  const [saved, setSaved] = useState(false);
  const [err, setErr]     = useState('');

  const upd = <K extends keyof GameSettings>(k: K, v: GameSettings[K]) =>
    setS(prev => ({ ...prev, [k]: v }));

  const rtpOk = Math.abs(s.rtp + s.platformFeeRate - 100) < 0.001;

  const save = () => {
    if (!rtpOk) { setErr('RTP + Platform fee must equal 100%'); return; }
    setErr('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <SectionCard title="Economics">
        <SettingRow label="RTP (Return to Player)" sub="% of every paint spend returned as prizes">
          <NumInput value={s.rtp} onChange={v => upd('rtp', v)} min={80} max={99} step={0.5} suffix="%" />
        </SettingRow>
        <SettingRow label="Platform Fee" sub="% kept by Canvas — auto-set (100 − RTP)">
          <div style={{ color: '#a78bfa', fontSize: 14, fontFamily: 'Share Tech Mono', minWidth: 60, textAlign: 'right' }}>{(100 - s.rtp).toFixed(2)}%</div>
        </SettingRow>
        {!rtpOk && <div style={{ color: '#f87171', fontSize: 12, marginTop: 8 }}>⚠ RTP + fee = {(s.rtp + s.platformFeeRate).toFixed(2)}% (must equal 100%)</div>}
      </SectionCard>

      <SectionCard title="Brush Tiers (USDT)">
        {(['Tier 1 (micro)', 'Tier 2 (standard)', 'Tier 3 (whale)'] as const).map((label, i) => (
          <SettingRow key={i} label={label} sub={`Places ${[1,10,100][i]}px per click`}>
            <NumInput
              value={s.brushTiers[i]}
              onChange={v => { const t = [...s.brushTiers] as [number,number,number]; t[i] = v; upd('brushTiers', t); }}
              min={0.1} step={1} suffix="USDT"
            />
          </SettingRow>
        ))}
      </SectionCard>

      <SectionCard title="Strike Mechanics">
        {(['common', 'rare', 'legendary'] as const).map(tier => (
          <div key={tier}>
            <div style={{ color: tier === 'legendary' ? '#f59e0b' : tier === 'rare' ? '#22d3ee' : '#64748b', fontSize: 11, fontFamily: 'Share Tech Mono', letterSpacing: 1, textTransform: 'uppercase', marginTop: 12, marginBottom: 4 }}>{tier}</div>
            <SettingRow label="Hit chance" sub="Probability per pixel placement">
              <NumInput value={s.strikeOdds[tier]} onChange={v => upd('strikeOdds', { ...s.strikeOdds, [tier]: v })} min={0.001} max={50} step={0.1} suffix="%" />
            </SettingRow>
            <SettingRow label="Multiplier" sub="Paint spend × multiplier = payout">
              <NumInput value={s.strikeMultipliers[tier]} onChange={v => upd('strikeMultipliers', { ...s.strikeMultipliers, [tier]: v })} min={1} max={10000} step={1} suffix="×" />
            </SettingRow>
          </div>
        ))}
      </SectionCard>

      <SectionCard title="Shield">
        <SettingRow label="Cost per pixel" sub="$CANVAS tokens per pixel shielded">
          <NumInput value={s.shieldCostPerPixel} onChange={v => upd('shieldCostPerPixel', v)} min={0.1} step={0.5} suffix="$CANVAS" />
        </SettingRow>
        <SettingRow label="Shield duration" sub="Hours a shield lasts after activation">
          <NumInput value={s.shieldDurationHours} onChange={v => upd('shieldDurationHours', v)} min={1} max={168} step={1} suffix="hrs" />
        </SettingRow>
      </SectionCard>

      {err && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{err}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <SaveButton onClick={save} saved={saved} />
      </div>
    </div>
  );
}

function AffiliateTab() {
  const [s, setS] = useState<AffiliateSettings>({
    cascadePool: AFFILIATE_POOL,
    directBonus: DIRECT_BONUS,
    maxDepth: MAX_DEPTH,
    minRateFloor: 10,
  });
  const [saved, setSaved] = useState(false);

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const totalAffiliateCost = ((s.cascadePool + s.directBonus) / 100) * 4; // % of gross spend
  const canvasMinKeepPct   = 4 - totalAffiliateCost;

  return (
    <div>
      <SectionCard title="Cascade Pool">
        <SettingRow label="Default L1 max rate" sub="Max % of platform fees a top-level affiliate can earn">
          <NumInput value={s.cascadePool} onChange={v => setS(prev => ({ ...prev, cascadePool: v }))} min={1} max={30} step={0.5} suffix="%" />
        </SettingRow>
        <SettingRow label="Direct bonus" sub="Guaranteed % to the immediate referrer (on top of cascade)">
          <NumInput value={s.directBonus} onChange={v => setS(prev => ({ ...prev, directBonus: v }))} min={0} max={30} step={0.5} suffix="%" />
        </SettingRow>
        <SettingRow label="Max depth" sub="Maximum referral chain depth (levels)">
          <NumInput value={s.maxDepth} onChange={v => setS(prev => ({ ...prev, maxDepth: Math.round(v) }))} min={1} max={50} step={1} suffix="lvls" />
        </SettingRow>
        <SettingRow label="Min rate floor" sub="Min % of your own rate you must give downline (if maxRate ≥ 10%)">
          <NumInput value={s.minRateFloor} onChange={v => setS(prev => ({ ...prev, minRateFloor: v }))} min={0} max={50} step={1} suffix="%" />
        </SettingRow>
      </SectionCard>

      <SectionCard title="Cost preview (per $100 player spend)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Platform fee',         val: `$4.00`,                                        color: '#a78bfa' },
            { label: 'Cascade pool max',     val: `$${(4 * s.cascadePool / 100).toFixed(2)}`,     color: '#22d3ee' },
            { label: 'Direct bonus max',     val: `$${(4 * s.directBonus / 100).toFixed(2)}`,     color: '#f59e0b' },
            { label: 'Canvas min keeps',     val: `$${(4 - totalAffiliateCost).toFixed(2)}`,       color: '#4ade80' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#94a3b8' }}>{r.label}</span>
              <span style={{ color: r.color, fontFamily: 'Share Tech Mono' }}>{r.val}</span>
            </div>
          ))}
          {canvasMinKeepPct < 0 && (
            <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>⚠ Affiliate cost exceeds platform fee — Canvas would lose money</div>
          )}
        </div>
      </SectionCard>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <SaveButton onClick={save} saved={saved} />
      </div>
    </div>
  );
}

function UsersTab() {
  const [affiliates, setAffiliates] = useState<AffiliateRow[]>([]);
  const [search, setSearch]         = useState('');
  const [elevated, setElevated]     = useState(false);
  const [editId, setEditId]         = useState<string | null>(null);
  const [editRate, setEditRate]     = useState<number>(5);
  const [saving, setSaving]         = useState(false);
  const [savedId, setSavedId]       = useState<string | null>(null);

  // Mock load
  useEffect(() => {
    const all: AffiliateRow[] = [
      { id: '@gigabrain_xyz',  referralCode: 'BRAIN1', maxRate: 15, downlineDefaultRate: 8,  totalEarned: 3420.50, totalClaimed: 2100.00, volume: 85512, subCount: 142, createdAt: '2026-01-15' },
      { id: '@pepearmy_sol',   referralCode: 'PEPER2', maxRate: 10, downlineDefaultRate: 5,  totalEarned: 1180.20, totalClaimed: 900.00,  volume: 29505, subCount: 61,  createdAt: '2026-02-01' },
      { id: '@solqueen_99',    referralCode: 'QUEEN3', maxRate: 5,  downlineDefaultRate: 0,  totalEarned: 441.80,  totalClaimed: 441.80,  volume: 22090, subCount: 23,  createdAt: '2026-02-14' },
      { id: '0x7f4…a9c',       referralCode: 'CNVS42', maxRate: 5,  downlineDefaultRate: 3,  totalEarned: 182.40,  totalClaimed: 135.00,  volume: 4560,  subCount: 4,   createdAt: '2026-03-01' },
      { id: '@alice_sol',      referralCode: 'ALIC5',  maxRate: 3,  downlineDefaultRate: 1,  totalEarned: 44.20,   totalClaimed: 22.10,   volume: 1474,  subCount: 4,   createdAt: '2026-03-05' },
      { id: '@bob_xyz',        referralCode: 'BOBX6',  maxRate: 3,  downlineDefaultRate: 0,  totalEarned: 18.60,   totalClaimed: 18.60,   volume: 620,   subCount: 0,   createdAt: '2026-03-10' },
      { id: '@carol_gg',       referralCode: 'CARO7',  maxRate: 3,  downlineDefaultRate: 2,  totalEarned: 31.50,   totalClaimed: 0,       volume: 1050,  subCount: 2,   createdAt: '2026-03-15' },
      { id: '@dave_px',        referralCode: 'DAVE8',  maxRate: 3,  downlineDefaultRate: 0,  totalEarned: 5.10,    totalClaimed: 5.10,    volume: 170,   subCount: 0,   createdAt: '2026-03-20' },
    ];
    setAffiliates(all);
  }, []);

  const filtered = affiliates.filter(a => {
    if (elevated && a.maxRate <= AFFILIATE_POOL) return false;
    if (search && !a.id.toLowerCase().includes(search.toLowerCase()) && !a.referralCode.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const startEdit = (a: AffiliateRow) => { setEditId(a.id); setEditRate(a.maxRate); };

  const commitEdit = async (affiliateId: string) => {
    setSaving(true);
    // In production: await fetch('/api/admin/affiliate/set-max-rate', { method: 'POST', headers: { 'x-admin-key': ADMIN_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ affiliateId, maxRate: editRate }) })
    setAffiliates(prev => prev.map(a => a.id === affiliateId ? { ...a, maxRate: editRate } : a));
    setSaving(false);
    setEditId(null);
    setSavedId(affiliateId);
    setTimeout(() => setSavedId(null), 2000);
  };

  return (
    <div>
      <SectionCard title="Affiliate users">
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input
            placeholder="Search by username or code…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 14px', color: '#e2e8f0', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
          />
          <button
            onClick={() => setElevated(e => !e)}
            style={{ background: elevated ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${elevated ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`, color: elevated ? '#f59e0b' : '#64748b', borderRadius: 8, padding: '9px 16px', fontSize: 12, fontFamily: 'Share Tech Mono', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            ★ ELEVATED ONLY
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: '#475569', fontSize: 11, fontFamily: 'Share Tech Mono', letterSpacing: 1 }}>
                {['USER', 'CODE', 'MAX RATE', 'DOWNLINE', 'VOLUME', 'EARNED', 'SUBS', 'JOINED', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 10px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => {
                const isElevated = a.maxRate > AFFILIATE_POOL;
                const isEditing  = editId === a.id;
                const justSaved  = savedId === a.id;
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px', color: isElevated ? '#f59e0b' : '#e2e8f0' }}>
                      {isElevated && <span style={{ fontSize: 10, marginRight: 4 }}>★</span>}
                      {a.id}
                    </td>
                    <td style={{ padding: '10px', color: '#64748b', fontFamily: 'Share Tech Mono' }}>{a.referralCode}</td>
                    <td style={{ padding: '10px' }}>
                      {isEditing ? (
                        <input
                          type="number" value={editRate} min={AFFILIATE_POOL} max={50} step={0.5}
                          onChange={e => setEditRate(parseFloat(e.target.value) || AFFILIATE_POOL)}
                          style={{ width: 60, background: 'rgba(255,255,255,0.08)', border: '1px solid #6366f1', borderRadius: 6, padding: '4px 8px', color: '#f1f5f9', fontSize: 13, fontFamily: 'Share Tech Mono', outline: 'none', textAlign: 'right' }}
                          autoFocus
                        />
                      ) : (
                        <span style={{ color: isElevated ? '#f59e0b' : '#94a3b8', fontFamily: 'Share Tech Mono' }}>{a.maxRate}%</span>
                      )}
                    </td>
                    <td style={{ padding: '10px', color: '#64748b', fontFamily: 'Share Tech Mono' }}>{a.downlineDefaultRate}%</td>
                    <td style={{ padding: '10px', color: '#22d3ee', fontFamily: 'Share Tech Mono' }}>{fmtUSDT(a.volume)}</td>
                    <td style={{ padding: '10px', color: '#4ade80', fontFamily: 'Share Tech Mono' }}>{fmtUSDT(a.totalEarned)}</td>
                    <td style={{ padding: '10px', color: '#94a3b8' }}>{a.subCount}</td>
                    <td style={{ padding: '10px', color: '#475569', fontSize: 11 }}>{a.createdAt}</td>
                    <td style={{ padding: '10px' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => commitEdit(a.id)} disabled={saving} style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid #6366f1', color: '#a5b4fc', borderRadius: 6, padding: '4px 12px', fontSize: 11, fontFamily: 'Share Tech Mono', cursor: 'pointer' }}>SAVE</button>
                          <button onClick={() => setEditId(null)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#475569', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>✕</button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(a)} style={{ background: justSaved ? 'rgba(22,163,74,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${justSaved ? '#16a34a' : 'rgba(255,255,255,0.08)'}`, color: justSaved ? '#4ade80' : '#64748b', borderRadius: 6, padding: '4px 12px', fontSize: 11, fontFamily: 'Share Tech Mono', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          {justSaved ? '✓' : 'SET RATE'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ padding: 24, color: '#475569', textAlign: 'center' }}>No affiliates found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Admin Password Gate ──────────────────────────────────────────────────────

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [key, setKey] = useState('');
  const [err, setErr] = useState(false);
  const check = () => {
    // Dev: accepts "canvas-admin-dev"; prod: check against real key
    if (key === 'canvas-admin-dev' || key === (process.env.NEXT_PUBLIC_ADMIN_KEY ?? '')) {
      onUnlock();
    } else {
      setErr(true);
      setTimeout(() => setErr(false), 1500);
    }
  };
  return (
    <div style={{ minHeight: '100vh', background: '#070710', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 40, width: 340, textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
        <div style={{ color: '#e2e8f0', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Admin Access</div>
        <div style={{ color: '#475569', fontSize: 13, marginBottom: 28 }}>Canvas Control Panel</div>
        <input
          type="password"
          placeholder="Admin key"
          value={key} onChange={e => setKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()}
          style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: `1px solid ${err ? '#f87171' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, padding: '11px 14px', color: '#f1f5f9', fontSize: 14, outline: 'none', marginBottom: 12, fontFamily: 'inherit', transition: 'border 0.2s' }}
        />
        {err && <div style={{ color: '#f87171', fontSize: 12, marginBottom: 10 }}>Incorrect key</div>}
        <button onClick={check} style={{ width: '100%', background: 'rgba(99,102,241,0.2)', border: '1px solid #6366f1', color: '#a5b4fc', borderRadius: 8, padding: '11px', fontSize: 14, fontFamily: 'Share Tech Mono', cursor: 'pointer' }}>UNLOCK</button>
      </div>
    </div>
  );
}

// ─── Main Admin Panel ─────────────────────────────────────────────────────────

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<AdminTab>('overview');

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  const TABS: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'overview',   label: 'Overview',   icon: '📊' },
    { id: 'game',       label: 'Game',        icon: '🎮' },
    { id: 'affiliate',  label: 'Affiliate',   icon: '🔗' },
    { id: 'users',      label: 'Users',       icon: '👥' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#070710', color: '#e2e8f0', fontFamily: "'Share Tech Mono', 'Courier New', monospace" }}>
      {/* Nav */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 32px', display: 'flex', alignItems: 'center', gap: 24, height: 56, background: 'rgba(0,0,0,0.3)' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <CanvasLogo size="sm" />
        </Link>
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ fontSize: 11, color: '#64748b', letterSpacing: 2, textTransform: 'uppercase' }}>Admin Panel</div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 10, color: '#1e3a4f', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 6, padding: '3px 10px', letterSpacing: 1 }}>INTERNAL — NOT LINKED</div>
        <Link href="/play" style={{ fontSize: 11, color: '#6366f1', textDecoration: 'none', letterSpacing: 1 }}>← GAME</Link>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{ background: tab === t.id ? 'rgba(99,102,241,0.2)' : 'transparent', border: tab === t.id ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent', color: tab === t.id ? '#a5b4fc' : '#475569', borderRadius: 8, padding: '8px 20px', fontSize: 12, fontFamily: 'Share Tech Mono', cursor: 'pointer', letterSpacing: 0.5, transition: 'all 0.15s' }}
            >
              {t.icon} {t.label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'overview'  && <OverviewTab stats={MOCK_STATS} />}
        {tab === 'game'      && <GameTab />}
        {tab === 'affiliate' && <AffiliateTab />}
        {tab === 'users'     && <UsersTab />}
      </div>
    </div>
  );
}
