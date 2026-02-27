"use client";
// ═══════════════════════════════════════════════════════════
// #35 Deep — STATUS PAGE UI
// Public-facing status page showing all system components
// ═══════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react';

const GOLD='#c6a34e',GREEN='#22c55e',RED='#ef4444',ORANGE='#f97316';
const STATUS_MAP = {
  operational: { color: GREEN, label: 'Opérationnel', icon: '●' },
  degraded: { color: ORANGE, label: 'Dégradé', icon: '●' },
  major_outage: { color: RED, label: 'Panne', icon: '●' },
  maintenance: { color: '#3b82f6', label: 'Maintenance', icon: '●' },
};

export function StatusPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/status');
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } catch (e) {
      setData({ status: 'major_outage', components: [{ name: 'API', status: 'major_outage' }] });
    }
    setLoading(false);
  };

  useEffect(() => { refresh(); const iv = setInterval(refresh, 30000); return () => clearInterval(iv); }, []);

  if (!data) return React.createElement('div', { style: { textAlign: 'center', padding: 60, color: '#555' } }, 'Chargement...');
  
  const st = STATUS_MAP[data.status] || STATUS_MAP.operational;

  return React.createElement('div', { style: { maxWidth: 700, margin: '0 auto' } },
    // Hero status
    React.createElement('div', { style: { textAlign: 'center', padding: '32px 20px', borderRadius: 16, border: `1px solid ${st.color}22`, background: `${st.color}08`, marginBottom: 20 } },
      React.createElement('div', { style: { fontSize: 18, fontWeight: 600, color: st.color } }, st.icon + ' ' + st.label),
      React.createElement('div', { style: { fontSize: 12, color: '#666', marginTop: 6 } }, 'Vérifié à ' + (lastRefresh?.toLocaleTimeString('fr-BE') || '—') + ' • Réponse : ' + (data.response_time_ms || 0) + 'ms')
    ),
    // Components
    React.createElement('div', { style: { padding: 20, borderRadius: 16, border: '1px solid rgba(198,163,78,.06)', background: 'rgba(255,255,255,.01)', marginBottom: 20 } },
      (data.components || []).map((c, i) => {
        const s = STATUS_MAP[c.status] || STATUS_MAP.operational;
        return React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < data.components.length - 1 ? '1px solid rgba(255,255,255,.02)' : 'none' } },
          React.createElement('span', { style: { fontSize: 13, color: '#e5e5e5' } }, c.name),
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
            c.latency != null && React.createElement('span', { style: { fontSize: 10, color: '#555', fontFamily: "'JetBrains Mono',monospace" } }, c.latency + 'ms'),
            React.createElement('span', { style: { color: s.color, fontSize: 11, fontWeight: 600 } }, s.label)
          )
        );
      })
    ),
    // Uptime
    data.uptime && React.createElement('div', { style: { padding: 20, borderRadius: 16, border: '1px solid rgba(198,163,78,.06)', background: 'rgba(255,255,255,.01)', marginBottom: 20 } },
      React.createElement('div', { style: { fontSize: 10, color: '#555', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 } }, 'Uptime'),
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 } },
        Object.entries(data.uptime).map(([k, v]) => React.createElement('div', { key: k, style: { textAlign: 'center' } },
          React.createElement('div', { style: { fontSize: 20, fontWeight: 300, color: parseFloat(v) >= 99.9 ? GREEN : GOLD, fontFamily: "'JetBrains Mono',monospace" } }, v),
          React.createElement('div', { style: { fontSize: 10, color: '#555', marginTop: 4 } }, k.replace('last_', '').replace('h', ' heures').replace('d', ' jours'))
        ))
      )
    ),
    // Footer
    React.createElement('div', { style: { textAlign: 'center', padding: '16px 0', fontSize: 11, color: '#444' } },
      'Aureus Social Pro v' + (data.version || '20.4') + ' — Aureus IA SPRL',
      React.createElement('button', { onClick: refresh, style: { marginLeft: 12, padding: '4px 12px', borderRadius: 6, border: '1px solid rgba(198,163,78,.1)', background: 'transparent', color: GOLD, fontSize: 10, cursor: 'pointer' } }, '↻ Rafraîchir')
    )
  );
}

export default StatusPage;
