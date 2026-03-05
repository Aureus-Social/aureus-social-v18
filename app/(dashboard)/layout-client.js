'use client';
import { useState, useMemo, lazy, Suspense } from 'react';
import { MENU, GROUPS, getGroupItems } from '../lib/menu-config';
import { supabase } from '../lib/supabase';

// Placeholder pour les pages pas encore migrées
function PlaceholderPage({ id, label }) {
  return (
    <div style={{ padding: 40 }}>
      <div style={{ fontSize: 19, fontWeight: 800, color: '#c6a34e', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 12, color: '#5e5c56' }}>Module en cours de migration — disponible prochainement</div>
    </div>
  );
}

// Dashboard principal
function DashboardHome({ state }) {
  const ae = (state.emps || []).filter(e => e.status === 'active' || !e.status);
  const masse = ae.reduce((a, e) => a + (+(e.monthlySalary || e.gross || 0)), 0);
  const fmt = n => new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(n || 0);
  const net = Math.round(masse * 0.6687);
  const cout = Math.round(masse * 1.2507);
  const now = new Date();
  const mois = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  return (
    <div>
      <div style={{ fontSize: 19, fontWeight: 800, color: '#c6a34e', marginBottom: 4 }}>Tableau de bord</div>
      <div style={{ fontSize: 12, color: '#5e5c56', marginBottom: 24 }}>{mois[now.getMonth()]} {now.getFullYear()} — Aureus IA SPRL · BCE BE 1028.230.781</div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { icon: '◉', label: 'Employés actifs', value: ae.length, sub: `0 sorti · 0 étudiant`, color: '#c6a34e' },
          { icon: '◈', label: 'Masse salariale brute', value: fmt(masse), sub: `Moy: ${fmt(ae.length ? masse / ae.length : 0)}/emp`, color: '#c6a34e' },
          { icon: '▤', label: 'Net total', value: fmt(net), sub: '68% du brut', color: '#22c55e' },
          { icon: '◆', label: 'Coût employeur total', value: fmt(cout), sub: 'Ratio: 125% du brut', color: '#a78bfa' },
        ].map((k, i) => (
          <div key={i} style={{ padding: '18px 20px', background: 'rgba(198,163,78,.03)', borderRadius: 12, border: '1px solid rgba(198,163,78,.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>{k.icon}</span>
              <span style={{ fontSize: 10, color: '#5e5c56', textTransform: 'uppercase', letterSpacing: '.5px' }}>{k.label}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 10, color: '#5e5c56', marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ padding: '18px 20px', background: 'rgba(198,163,78,.03)', borderRadius: 12, border: '1px solid rgba(198,163,78,.06)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#c6a34e', marginBottom: 12 }}>Échéances & Obligations</div>
          {[
            { icon: '◆', label: 'DmfA T1/2026', date: '31/03/2026', type: 'trimestriel' },
            { icon: '◇', label: 'Précompte professionnel 274', date: '5/04/2026', type: 'mensuel' },
            { icon: '◆', label: 'Provisions ONSS mensuelles', date: '5 du mois', type: 'mensuel' },
            { icon: '⬆', label: 'Dimona IN — Avant embauche', date: 'Permanent', type: '' },
          ].map((e, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.03)', fontSize: 12 }}>
              <span><span style={{ marginRight: 8 }}>{e.icon}</span>{e.label}</span>
              <span style={{ color: '#c6a34e', fontSize: 11 }}>{e.date}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '18px 20px', background: 'rgba(198,163,78,.03)', borderRadius: 12, border: '1px solid rgba(198,163,78,.06)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#c6a34e', marginBottom: 12 }}>Actions rapides</div>
          {[
            { icon: '◉', label: '+ Nouvel employé', id: 'employees' },
            { icon: '◈', label: 'Générer fiche de paie', id: 'payslip' },
            { icon: '⬆', label: 'Dimona IN/OUT', id: 'declarations' },
            { icon: '◆', label: 'DmfA trimestrielle', id: 'declarations' },
          ].map((a, i) => (
            <div key={i} style={{ padding: '10px 12px', borderRadius: 8, marginBottom: 4, cursor: 'pointer', fontSize: 12, background: 'rgba(198,163,78,.02)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(198,163,78,.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(198,163,78,.02)'}>
              <span style={{ marginRight: 8 }}>{a.icon}</span>{a.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ user }) {
  const [page, setPage] = useState('dashboard');
  const [collapsed, setCollapsed] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [state] = useState({ emps: [], clients: [], co: { name: 'Aureus IA SPRL', vat: 'BE 1028.230.781' } });

  const toggleGroup = (gId) => setCollapsed(p => ({ ...p, [gId]: !p[gId] }));
  const currentItem = MENU.find(m => m.id === page) || { label: 'Dashboard' };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    window.location.reload();
  };

  const renderPage = () => {
    if (page === 'dashboard') return <DashboardHome state={state} />;
    return <PlaceholderPage id={page} label={currentItem.label} />;
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* SIDEBAR */}
      <div style={{ width: sidebarOpen ? 260 : 0, background: '#0a0908', borderRight: '1px solid rgba(198,163,78,.06)', display: 'flex', flexDirection: 'column', transition: 'width .2s', overflow: 'hidden', flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(198,163,78,.06)' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#c6a34e', letterSpacing: '2px' }}>AUREUS</div>
          <div style={{ fontSize: 9, color: '#5e5c56', letterSpacing: '3px', marginTop: 2 }}>SOCIAL PRO</div>
        </div>

        {/* Menu */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {[1, 2, 3, 4, 5, 6, 7].map(gNum => {
            const group = GROUPS.find(g => g.id === `_g${gNum}`);
            const items = getGroupItems(gNum);
            const isCollapsed = collapsed[gNum];
            return (
              <div key={gNum}>
                <div onClick={() => toggleGroup(gNum)}
                  style={{ padding: '10px 18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#5e5c56', letterSpacing: '.5px', textTransform: 'uppercase' }}>
                    {group?.icon} {group?.label}
                  </span>
                  <span style={{ fontSize: 10, color: '#5e5c56', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0)', transition: 'transform .15s' }}>▼</span>
                </div>
                {!isCollapsed && items.map(item => (
                  <div key={item.id} onClick={() => setPage(item.id)}
                    style={{
                      padding: '7px 18px 7px 24px', cursor: 'pointer', fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 8,
                      background: page === item.id ? 'rgba(198,163,78,.08)' : 'transparent',
                      color: page === item.id ? '#c6a34e' : '#9e9b93',
                      borderLeft: page === item.id ? '2px solid #c6a34e' : '2px solid transparent',
                    }}
                    onMouseEnter={e => { if (page !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,.02)'; }}
                    onMouseLeave={e => { if (page !== item.id) e.currentTarget.style.background = 'transparent'; }}>
                    <span style={{ fontSize: 13, width: 20, textAlign: 'center' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Footer sidebar */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(198,163,78,.06)', fontSize: 9, color: '#5e5c56' }}>
          <div>v38 · Sprint 38</div>
          <div>BE 1028.230.781</div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid rgba(198,163,78,.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: 'none', border: 'none', color: '#5e5c56', cursor: 'pointer', fontSize: 16, padding: 4 }}>☰</button>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#e8e6e0' }}>{currentItem.icon} {currentItem.label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 11, color: '#9e9b93' }}>{user?.email || 'demo'}</span>
            <button onClick={handleLogout}
              style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid rgba(239,68,68,.15)', background: 'rgba(239,68,68,.05)', color: '#ef4444', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
              Déconnexion
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
