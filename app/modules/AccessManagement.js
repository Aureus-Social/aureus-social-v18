'use client';
import { useState, useEffect } from 'react';

const ROLE_CONFIG = {
  client: { label: 'Client / Employeur', icon: '🏢', color: '#22c55e' },
  employee: { label: 'Employé', icon: '👤', color: '#60a5fa' },
  commercial: { label: 'Commercial(e)', icon: '📈', color: '#f97316' },
  gestionnaire: { label: 'Gestionnaire', icon: '📋', color: '#3b82f6' },
  comptable: { label: 'Comptable', icon: '🧮', color: '#a855f7' },
  readonly: { label: 'Lecture seule', icon: '👁', color: '#888' },
};

const ALL_MODULES = [
  { id: 'dashboard', label: 'Tableau de bord', icon: '📊', group: 'Base' },
  { id: 'employees', label: 'Employés', icon: '👥', group: 'Base' },
  { id: 'payslip', label: 'Fiches de paie', icon: '📄', group: 'Base' },
  { id: 'rh', label: 'Ressources Humaines', icon: '💼', group: 'Personnel & Paie' },
  { id: 'dimona', label: 'Dimona', icon: '📡', group: 'Personnel & Paie' },
  { id: 'sepa', label: 'SEPA & Paiements', icon: '💳', group: 'Personnel & Paie' },
  { id: 'calendrier', label: 'Calendrier Social', icon: '📅', group: 'Personnel & Paie' },
  { id: 'simulateurs', label: 'Simulateurs', icon: '🧮', group: 'Personnel & Paie' },
  { id: 'avantages', label: 'Primes & Avantages', icon: '🎁', group: 'Personnel & Paie' },
  { id: 'absences', label: 'Absences & Congés', icon: '🏖', group: 'Personnel & Paie' },
  { id: 'legal', label: 'Veille Légale', icon: '⚖', group: 'Juridique' },
  { id: 'contrats', label: 'Contrats', icon: '📝', group: 'Juridique' },
  { id: 'reporting', label: 'Reporting', icon: '📈', group: 'Reporting' },
  { id: 'commandcenter', label: 'Command Center', icon: '🎯', group: 'Reporting' },
  { id: 'commissions', label: 'Commissions', icon: '💰', group: 'Reporting' },
  { id: 'notifications', label: 'Notifications', icon: '🔔', group: 'Base' },
  { id: 'admin', label: 'Administration', icon: '👑', group: 'Admin' },
];

const CLIENT_DEFAULT_MODULES = ['dashboard','employees','payslip','rh','calendrier','notifications','absences'];
const EMPLOYEE_DEFAULT_MODULES = ['dashboard','payslip','rh','calendrier'];

export default function AccessManagement({ supabase, t }) {
  const [requests, setRequests] = useState({});
  const [filter, setFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    try {
      const raw = localStorage.getItem('aureus_access_requests');
      if (raw) setRequests(JSON.parse(raw));
    } catch(e) {}
  };

  const save = (updated) => {
    setRequests(updated);
    localStorage.setItem('aureus_access_requests', JSON.stringify(updated));
  };

  const updateUser = (userId, changes) => {
    const updated = { ...requests, [userId]: { ...requests[userId], ...changes, updatedAt: new Date().toISOString() } };
    save(updated);
  };

  const deleteUser = (userId) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    const updated = { ...requests };
    delete updated[userId];
    save(updated);
    setSelectedUser(null);
  };

  const entries = Object.entries(requests);
  const filtered = filter === 'all' ? entries : entries.filter(([,r]) => r.status === filter);
  const pendingCount = entries.filter(([,r]) => r.status === 'pending').length;

  const S = {
    card: { background: 'rgba(198,163,78,0.03)', border: '1px solid rgba(198,163,78,0.1)', borderRadius: 12, padding: 16, marginBottom: 10, cursor: 'pointer' },
    btn: (bg, color) => ({ padding: '6px 14px', borderRadius: 8, border: 'none', background: bg, color, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }),
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#c6a34e', margin: 0 }}>🔐 Gestion des Accès</h2>
          <p style={{ fontSize: 12, color: '#9e9b93', margin: '4px 0 0' }}>
            {entries.length} utilisateurs · {pendingCount > 0 && <span style={{ color: '#eab308' }}>{pendingCount} en attente</span>}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
            border: filter === f ? '1px solid rgba(198,163,78,0.3)' : '1px solid rgba(255,255,255,0.06)',
            background: filter === f ? 'rgba(198,163,78,0.1)' : 'transparent',
            color: filter === f ? '#c6a34e' : '#5e5c56',
          }}>
            {f === 'all' ? 'Tous' : f === 'pending' ? '⏳ En attente' : f === 'approved' ? '✅ Approuvés' : '❌ Refusés'}
            {f === 'pending' && pendingCount > 0 && <span style={{ marginLeft: 4, background: '#eab308', color: '#000', borderRadius: 10, padding: '1px 6px', fontSize: 10 }}>{pendingCount}</span>}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedUser ? '1fr 1fr' : '1fr', gap: 20 }}>
        <div>
          {filtered.length === 0 && <div style={{ ...S.card, textAlign: 'center', padding: 40, color: '#5e5c56' }}>Aucun utilisateur dans cette catégorie</div>}
          {filtered.map(([uid, req]) => (
            <div key={uid} onClick={() => setSelectedUser(uid)} style={{
              ...S.card, borderColor: selectedUser === uid ? 'rgba(198,163,78,0.4)' : S.card.borderColor,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e6e0' }}>{req.email}</div>
                  <div style={{ fontSize: 11, color: '#5e5c56' }}>
                    {ROLE_CONFIG[req.role]?.icon} {ROLE_CONFIG[req.role]?.label || req.role} · {new Date(req.requestedAt).toLocaleDateString('fr-BE')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{
                    fontSize: 10, padding: '3px 10px', borderRadius: 12, fontWeight: 600,
                    background: req.status === 'approved' ? 'rgba(34,197,94,0.1)' : req.status === 'pending' ? 'rgba(234,179,8,0.1)' : 'rgba(248,113,113,0.1)',
                    color: req.status === 'approved' ? '#22c55e' : req.status === 'pending' ? '#eab308' : '#f87171',
                  }}>
                    {req.status === 'approved' ? '✅' : req.status === 'pending' ? '⏳' : '❌'} {req.status}
                  </span>
                  {req.status === 'pending' && <>
                    <button onClick={e => { e.stopPropagation(); updateUser(uid, { status: 'approved', modules: CLIENT_DEFAULT_MODULES }); }} style={S.btn('rgba(34,197,94,0.12)', '#22c55e')}>✅</button>
                    <button onClick={e => { e.stopPropagation(); updateUser(uid, { status: 'rejected' }); }} style={S.btn('rgba(248,113,113,0.12)', '#f87171')}>❌</button>
                  </>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedUser && requests[selectedUser] && (() => {
          const req = requests[selectedUser];
          return (
            <div style={{ ...S.card, position: 'sticky', top: 20, alignSelf: 'start' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ margin: 0, color: '#c6a34e', fontSize: 15 }}>Configuration</h3>
                <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', color: '#5e5c56', cursor: 'pointer', fontSize: 16 }}>✕</button>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#e8e6e0', marginBottom: 12 }}>{req.email}</div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: '#5e5c56', marginBottom: 6 }}>Statut</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['pending', 'approved', 'rejected', 'suspended'].map(st => (
                    <button key={st} onClick={() => updateUser(selectedUser, { status: st })} style={{
                      ...S.btn(req.status === st ? 'rgba(198,163,78,0.15)' : 'rgba(255,255,255,0.03)', req.status === st ? '#c6a34e' : '#5e5c56'),
                      border: req.status === st ? '1px solid rgba(198,163,78,0.3)' : '1px solid rgba(255,255,255,0.06)',
                    }}>{st}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: '#5e5c56', marginBottom: 6 }}>Rôle</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {Object.entries(ROLE_CONFIG).map(([rid, rc]) => (
                    <button key={rid} onClick={() => updateUser(selectedUser, { role: rid })} style={{
                      ...S.btn(req.role === rid ? rc.color + '22' : 'rgba(255,255,255,0.03)', req.role === rid ? rc.color : '#5e5c56'),
                      border: req.role === rid ? `1px solid ${rc.color}44` : '1px solid rgba(255,255,255,0.06)',
                    }}>{rc.icon} {rc.label}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: '#5e5c56', marginBottom: 6 }}>Modules ({(req.modules || []).length}/{ALL_MODULES.length})</div>
                <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                  <button onClick={() => updateUser(selectedUser, { modules: ALL_MODULES.map(m => m.id) })} style={S.btn('rgba(34,197,94,0.08)', '#22c55e')}>✅ Tout</button>
                  <button onClick={() => updateUser(selectedUser, { modules: [] })} style={S.btn('rgba(248,113,113,0.08)', '#f87171')}>❌ Rien</button>
                  <button onClick={() => updateUser(selectedUser, { modules: CLIENT_DEFAULT_MODULES })} style={S.btn('rgba(34,197,94,0.08)', '#22c55e')}>Client std</button>
                  <button onClick={() => updateUser(selectedUser, { modules: EMPLOYEE_DEFAULT_MODULES })} style={S.btn('rgba(96,165,250,0.08)', '#60a5fa')}>Employé std</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {ALL_MODULES.map(m => {
                    const active = (req.modules || []).includes(m.id);
                    return (
                      <button key={m.id} onClick={() => {
                        const mods = active ? (req.modules || []).filter(x => x !== m.id) : [...(req.modules || []), m.id];
                        updateUser(selectedUser, { modules: mods });
                      }} style={{
                        padding: '4px 10px', borderRadius: 6, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit',
                        border: active ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.06)',
                        background: active ? 'rgba(34,197,94,0.08)' : 'transparent',
                        color: active ? '#22c55e' : '#5e5c56',
                      }}>
                        {active ? '✅' : '⬜'} {m.icon} {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(248,113,113,0.1)', paddingTop: 12, marginTop: 12 }}>
                <button onClick={() => deleteUser(selectedUser)} style={S.btn('rgba(248,113,113,0.1)', '#f87171')}>🗑 Supprimer l'utilisateur</button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
