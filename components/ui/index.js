'use client';

// ═══ AUREUS DESIGN SYSTEM ═══
export function PH({ title, sub }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 19, fontWeight: 800, color: '#c6a34e', letterSpacing: '.4px' }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: '#9e9b93', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export function Card({ children, style }) {
  return (
    <div style={{ padding: '16px 20px', background: 'rgba(198,163,78,.03)', borderRadius: 12, border: '1px solid rgba(198,163,78,.06)', marginBottom: 14, ...style }}>
      {children}
    </div>
  );
}

export function ST({ children }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 700, color: '#c6a34e', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid rgba(198,163,78,.1)' }}>
      {children}
    </div>
  );
}

export function KPI({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(items.length, 4)}, 1fr)`, gap: 12, marginBottom: 16 }}>
      {items.map((k, i) => (
        <div key={i} style={{ padding: '14px 16px', background: 'rgba(198,163,78,.04)', borderRadius: 10, border: '1px solid rgba(198,163,78,.08)' }}>
          <div style={{ fontSize: 10, color: '#5e5c56', textTransform: 'uppercase', letterSpacing: '.5px' }}>{k.label}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: k.color || '#c6a34e', marginTop: 4 }}>{k.value}</div>
        </div>
      ))}
    </div>
  );
}

export function DataRow({ items }) {
  return items.map((r, i) => (
    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.03)', fontSize: 12, fontWeight: r.bold ? 700 : 400 }}>
      <span style={{ color: r.bold ? '#e8e6e0' : '#9e9b93' }}>{r.label}</span>
      <span style={{ color: r.color || '#e8e6e0' }}>{r.value}</span>
    </div>
  ));
}

export function Badge({ text, color }) {
  return (
    <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, background: (color || '#c6a34e') + '15', color: color || '#c6a34e', fontWeight: 600 }}>
      {text}
    </span>
  );
}

export function Btn({ children, onClick, variant = 'gold', disabled, style: s }) {
  const styles = {
    gold: { background: 'linear-gradient(135deg,#c6a34e,#a68a3c)', color: '#0c0b09' },
    outline: { background: 'transparent', color: '#c6a34e', border: '1px solid rgba(198,163,78,.2)' },
    danger: { background: 'rgba(239,68,68,.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,.15)' },
    ghost: { background: 'rgba(255,255,255,.03)', color: '#9e9b93' },
  };
  const base = styles[variant] || styles.gold;
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: '10px 20px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: disabled ? .5 : 1, ...base, ...s }}>
      {children}
    </button>
  );
}

export const fmt = (n) => new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(n || 0);
export const fmtNum = (n) => new Intl.NumberFormat('fr-BE', { minimumFractionDigits: 2 }).format(n || 0);
export const fmtPct = (n) => ((n || 0) * 100).toFixed(2) + '%';
