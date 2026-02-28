'use client';
import { useState, useEffect } from 'react';

const ROLE_CONFIG = {
  admin: { label: 'Administrateur', icon: '👑', color: '#c6a34e', desc: 'Accès total — gestion plateforme' },
  gestionnaire: { label: 'Gestionnaire Paie', icon: '📋', color: '#3b82f6', desc: 'Calculs paie, déclarations, fiches' },
  commercial: { label: 'Commercial(e)', icon: '📈', color: '#f97316', desc: 'Clients assignés + commissions €2/fiche' },
  comptable: { label: 'Comptable', icon: '🧮', color: '#a855f7', desc: 'Exports comptables, fiscal, reporting' },
  client: { label: 'Client / Employeur', icon: '🏢', color: '#22c55e', desc: 'Portail client — ses employés uniquement' },
  employee: { label: 'Employé', icon: '👤', color: '#60a5fa', desc: 'Portail employé — ses fiches uniquement' },
  readonly: { label: 'Lecture seule', icon: '👁', color: '#888', desc: 'Consultation sans modification' },
};

const ALL_MODULES = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', group: 'Base' },
  { id: 'employees', label: 'Employés', icon: '👥', group: 'Gestion' },
  { id: 'payslip', label: 'Fiches de paie', icon: '📄', group: 'Gestion' },
  { id: 'piloteauto', label: 'Pilote Auto', icon: '🏎️', group: 'Gestion' },
  { id: 'rh', label: 'RH & Workflows', icon: '💼', group: 'Gestion' },
  { id: 'onss', label: 'ONSS/Dimona/DmfA', icon: '🏛', group: 'Déclarations' },
  { id: 'fiscal', label: 'Fiscal', icon: '📊', group: 'Déclarations' },
  { id: 'sepa', label: 'SEPA Virements', icon: '💳', group: 'Déclarations' },
  { id: 'contratsmenu', label: 'Contrats', icon: '📝', group: 'Juridique' },
  { id: 'legal', label: 'Veille Légale', icon: '⚖', group: 'Juridique' },
  { id: 'social', label: 'Social/Assurances', icon: '◆', group: 'Juridique' },
  { id: 'avantages', label: 'Primes & Avantages', icon: '🎁', group: 'Paie' },
  { id: 'gestionabs', label: 'Absences & Congés', icon: '🏖', group: 'Paie' },
  { id: 'salaires', label: 'Salaires & Calculs', icon: '◈', group: 'Paie' },
  { id: 'reporting', label: 'Reporting', icon: '📈', group: 'Reporting' },
  { id: 'exportcompta', label: 'Export Comptable', icon: '📤', group: 'Reporting' },
  { id: 'commandcenter', label: 'Command Center', icon: '🎯', group: 'Reporting' },
  { id: 'portailclient', label: 'Portail Client', icon: '🌐', group: 'Portails' },
  { id: 'portail', label: 'Portail Employé', icon: '👤', group: 'Portails' },
  { id: 'commissions', label: 'Commissions', icon: '💰', group: 'Commercial' },
  { id: 'notifications', label: 'Notifications', icon: '🔔', group: 'Base' },
  { id: 'admin', label: 'Administration', icon: '👑', group: 'Admin' },
];

// ═══ PRESETS PAR ROLE ═══
const ROLE_MODULES = {
  admin: ALL_MODULES.map(m => m.id),
  gestionnaire: ['dashboard','employees','payslip','piloteauto','rh','onss','fiscal','sepa','contratsmenu','legal','social','avantages','gestionabs','salaires','reporting','exportcompta','commandcenter','notifications'],
  commercial: ['dashboard','portailclient','commissions','notifications'],
  comptable: ['dashboard','payslip','fiscal','reporting','exportcompta','sepa','notifications'],
  client: ['dashboard','employees','payslip','gestionabs','portailclient','notifications'],
  employee: ['dashboard','payslip','portail','notifications'],
  readonly: ['dashboard','notifications'],
};

const S = {
  card: { background:'rgba(198,163,78,0.03)', border:'1px solid rgba(198,163,78,0.1)', borderRadius:12, padding:16, marginBottom:10 },
  input: { width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid rgba(198,163,78,0.2)', background:'rgba(0,0,0,0.3)', color:'#e8e6e0', fontSize:13, fontFamily:'inherit', outline:'none' },
  btn: (bg, color) => ({ padding:'8px 16px', borderRadius:8, border:'none', background:bg, color, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }),
  label: { fontSize:11, color:'#9e9b93', marginBottom:4, display:'block' },
};

export default function AccessManagement({ supabase }) {
  const [users, setUsers] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [newUser, setNewUser] = useState({ email:'', nom:'', prenom:'', role:'commercial', tel:'' });

  useEffect(() => { load(); }, []);

  const load = () => {
    try { const raw = localStorage.getItem('aureus_access_users'); if(raw) setUsers(JSON.parse(raw)); } catch(e) {}
  };
  const save = (updated) => { setUsers(updated); localStorage.setItem('aureus_access_users', JSON.stringify(updated)); };

  const addUser = () => {
    if(!newUser.email.trim()) return alert('Email requis');
    const id = 'u_' + Date.now();
    const modules = ROLE_MODULES[newUser.role] || ROLE_MODULES.readonly;
    const updated = { ...users, [id]: {
      ...newUser, email: newUser.email.toLowerCase().trim(),
      status:'active', role: newUser.role, modules,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      clients: [],
    }};
    save(updated);
    setNewUser({ email:'', nom:'', prenom:'', role:'commercial', tel:'' });
    setShowAdd(false);
    setSelectedUser(id);
  };

  const updateUser = (uid, changes) => {
    const updated = { ...users, [uid]: { ...users[uid], ...changes, updatedAt: new Date().toISOString() } };
    save(updated);
  };

  const deleteUser = (uid) => {
    if(!confirm('Supprimer définitivement cet utilisateur ?')) return;
    const updated = { ...users }; delete updated[uid]; save(updated);
    setSelectedUser(null);
  };

  const toggleModule = (uid, modId) => {
    const mods = users[uid]?.modules || [];
    const updated = mods.includes(modId) ? mods.filter(m => m !== modId) : [...mods, modId];
    updateUser(uid, { modules: updated });
  };

  const applyPreset = (uid, role) => {
    updateUser(uid, { role, modules: ROLE_MODULES[role] || [] });
  };

  const entries = Object.entries(users);
  const filtered = entries.filter(([,u]) => {
    if(!search.trim()) return true;
    const q = search.toLowerCase();
    return (u.email||'').toLowerCase().includes(q) || (u.nom||'').toLowerCase().includes(q) || (u.prenom||'').toLowerCase().includes(q);
  });
  const byRole = {};
  entries.forEach(([,u]) => { byRole[u.role] = (byRole[u.role]||0)+1; });

  return (
    <div style={{ maxWidth:1200, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:700, color:'#c6a34e', margin:'0 0 4px' }}>🔐 Gestion des Accès</h2>
          <p style={{ fontSize:12, color:'#9e9b93', margin:0 }}>{entries.length} utilisateur{entries.length>1?'s':''} · {Object.keys(ROLE_CONFIG).length} rôles disponibles</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={S.btn('linear-gradient(135deg,#c6a34e,#a68a3c)', '#0a0e1a')}>
          {showAdd ? '✕ Annuler' : '+ Ajouter un utilisateur'}
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20 }}>
        {[
          { l:'Total', v:entries.length, c:'#c6a34e' },
          { l:'Actifs', v:entries.filter(([,u])=>u.status==='active').length, c:'#22c55e' },
          { l:'Commerciaux', v:byRole.commercial||0, c:'#f97316' },
          { l:'Gestionnaires', v:byRole.gestionnaire||0, c:'#3b82f6' },
          { l:'Clients', v:byRole.client||0, c:'#22c55e' },
        ].map((k,i) => (
          <div key={i} style={{ padding:'14px 16px', background:'rgba(198,163,78,0.04)', borderRadius:12, border:'1px solid rgba(198,163,78,0.08)' }}>
            <div style={{ fontSize:10, color:'#5e5c56', textTransform:'uppercase', letterSpacing:1 }}>{k.l}</div>
            <div style={{ fontSize:22, fontWeight:700, color:k.c, marginTop:4 }}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Add User Form */}
      {showAdd && (
        <div style={{ ...S.card, border:'2px solid rgba(198,163,78,0.3)', marginBottom:20, padding:24 }}>
          <h3 style={{ margin:'0 0 16px', color:'#c6a34e', fontSize:16 }}>➕ Nouvel utilisateur</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:14, marginBottom:16 }}>
            <div><label style={S.label}>Email *</label><input value={newUser.email} onChange={e=>setNewUser({...newUser,email:e.target.value})} placeholder="email@exemple.be" style={S.input}/></div>
            <div><label style={S.label}>Prénom</label><input value={newUser.prenom} onChange={e=>setNewUser({...newUser,prenom:e.target.value})} placeholder="Jean" style={S.input}/></div>
            <div><label style={S.label}>Nom</label><input value={newUser.nom} onChange={e=>setNewUser({...newUser,nom:e.target.value})} placeholder="Dupont" style={S.input}/></div>
            <div><label style={S.label}>Téléphone</label><input value={newUser.tel} onChange={e=>setNewUser({...newUser,tel:e.target.value})} placeholder="+32..." style={S.input}/></div>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={S.label}>Rôle</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {Object.entries(ROLE_CONFIG).map(([rid,rc]) => (
                <button key={rid} onClick={() => setNewUser({...newUser, role:rid})} style={{
                  padding:'10px 16px', borderRadius:10, cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:newUser.role===rid?700:400,
                  border: newUser.role===rid ? `2px solid ${rc.color}` : '1px solid rgba(255,255,255,0.06)',
                  background: newUser.role===rid ? rc.color+'15' : 'rgba(255,255,255,0.02)',
                  color: newUser.role===rid ? rc.color : '#9e9b93',
                }}>
                  <div>{rc.icon} {rc.label}</div>
                  <div style={{ fontSize:9, color:'#5e5c56', marginTop:3 }}>{rc.desc}</div>
                  <div style={{ fontSize:9, color:rc.color, marginTop:2 }}>{(ROLE_MODULES[rid]||[]).length} modules</div>
                </button>
              ))}
            </div>
          </div>
          {newUser.role === 'commercial' && (
            <div style={{ padding:12, background:'rgba(249,115,22,0.06)', borderRadius:8, border:'1px solid rgba(249,115,22,0.15)', marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#f97316', marginBottom:4 }}>📈 Accès Commercial — Strict minimum</div>
              <div style={{ fontSize:11, color:'#9e9b93' }}>
                Dashboard · Portail Client · Commissions (€2/fiche) · Notifications<br/>
                <span style={{ color:'#5e5c56' }}>Le commercial ne voit QUE ses clients assignés et ses commissions.</span>
              </div>
            </div>
          )}
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
            <button onClick={() => setShowAdd(false)} style={S.btn('rgba(255,255,255,0.05)','#9e9b93')}>Annuler</button>
            <button onClick={addUser} style={S.btn('linear-gradient(135deg,#c6a34e,#a68a3c)','#0a0e1a')}>✅ Créer l'utilisateur</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom:16 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Rechercher par nom, email..." style={{...S.input, maxWidth:400}} />
      </div>

      {/* Grid: User list + Detail panel */}
      <div style={{ display:'grid', gridTemplateColumns: selectedUser ? '1fr 1.2fr' : '1fr', gap:20 }}>
        <div>
          {filtered.length === 0 && (
            <div style={{ ...S.card, textAlign:'center', padding:50, color:'#5e5c56' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>👥</div>
              <div style={{ fontSize:16, fontWeight:600 }}>Aucun utilisateur</div>
              <div style={{ fontSize:13, marginTop:8 }}>Cliquez "Ajouter un utilisateur" pour commencer.</div>
            </div>
          )}
          {filtered.map(([uid, u]) => {
            const rc = ROLE_CONFIG[u.role] || ROLE_CONFIG.readonly;
            const active = u.status === 'active';
            return (
              <div key={uid} onClick={() => setSelectedUser(selectedUser===uid?null:uid)} style={{
                ...S.card, cursor:'pointer',
                borderColor: selectedUser===uid ? 'rgba(198,163,78,0.4)' : undefined,
                opacity: active ? 1 : 0.5,
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:'#e8e6e0' }}>
                      {u.prenom||''} {u.nom||''} {(!u.prenom&&!u.nom) ? u.email : ''}
                    </div>
                    <div style={{ fontSize:11, color:'#5e5c56', marginTop:2 }}>{u.email}</div>
                    <div style={{ display:'flex', gap:8, marginTop:6 }}>
                      <span style={{ fontSize:10, padding:'3px 10px', borderRadius:10, fontWeight:600, background:rc.color+'18', color:rc.color }}>
                        {rc.icon} {rc.label}
                      </span>
                      <span style={{ fontSize:10, padding:'3px 10px', borderRadius:10, fontWeight:600,
                        background: active ? 'rgba(34,197,94,0.1)' : 'rgba(248,113,113,0.1)',
                        color: active ? '#22c55e' : '#f87171',
                      }}>
                        {active ? '✅ Actif' : u.status === 'suspended' ? '⏸ Suspendu' : '❌ Inactif'}
                      </span>
                      <span style={{ fontSize:10, color:'#5e5c56' }}>{(u.modules||[]).length} modules</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail Panel */}
        {selectedUser && users[selectedUser] && (() => {
          const u = users[selectedUser];
          const rc = ROLE_CONFIG[u.role] || ROLE_CONFIG.readonly;
          const groups = {};
          ALL_MODULES.forEach(m => { if(!groups[m.group]) groups[m.group]=[]; groups[m.group].push(m); });

          return (
            <div style={{ ...S.card, position:'sticky', top:20, alignSelf:'start', maxHeight:'85vh', overflowY:'auto', padding:24 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
                <h3 style={{ margin:0, color:'#c6a34e', fontSize:16 }}>⚙ Configuration</h3>
                <button onClick={() => setSelectedUser(null)} style={{ background:'none', border:'none', color:'#5e5c56', cursor:'pointer', fontSize:18 }}>✕</button>
              </div>

              {/* Info */}
              <div style={{ fontSize:16, fontWeight:700, color:'#e8e6e0', marginBottom:4 }}>
                {u.prenom||''} {u.nom||u.email}
              </div>
              <div style={{ fontSize:12, color:'#5e5c56', marginBottom:16 }}>{u.email} · {u.tel||'Pas de tel'}</div>

              {/* Statut */}
              <div style={{ marginBottom:16 }}>
                <label style={S.label}>Statut</label>
                <div style={{ display:'flex', gap:6 }}>
                  {['active','suspended','inactive'].map(st => {
                    const cols = { active:'#22c55e', suspended:'#eab308', inactive:'#f87171' };
                    const labels = { active:'✅ Actif', suspended:'⏸ Suspendu', inactive:'❌ Inactif' };
                    return (
                      <button key={st} onClick={() => updateUser(selectedUser,{status:st})} style={{
                        padding:'6px 14px', borderRadius:8, fontSize:11, cursor:'pointer', fontFamily:'inherit', fontWeight:u.status===st?700:400,
                        border: u.status===st ? `1px solid ${cols[st]}44` : '1px solid rgba(255,255,255,0.06)',
                        background: u.status===st ? cols[st]+'15' : 'transparent',
                        color: u.status===st ? cols[st] : '#5e5c56',
                      }}>{labels[st]}</button>
                    );
                  })}
                </div>
              </div>

              {/* Rôle avec preset auto */}
              <div style={{ marginBottom:16 }}>
                <label style={S.label}>Rôle (change les modules automatiquement)</label>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {Object.entries(ROLE_CONFIG).map(([rid,rconf]) => (
                    <button key={rid} onClick={() => applyPreset(selectedUser, rid)} style={{
                      padding:'6px 12px', borderRadius:8, fontSize:11, cursor:'pointer', fontFamily:'inherit', fontWeight:u.role===rid?700:400,
                      border: u.role===rid ? `1px solid ${rconf.color}44` : '1px solid rgba(255,255,255,0.06)',
                      background: u.role===rid ? rconf.color+'15' : 'transparent',
                      color: u.role===rid ? rconf.color : '#5e5c56',
                    }}>{rconf.icon} {rconf.label}</button>
                  ))}
                </div>
              </div>

              {/* Modules granulaires */}
              <div style={{ marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <label style={{...S.label, margin:0}}>Modules ({(u.modules||[]).length}/{ALL_MODULES.length})</label>
                  <div style={{ display:'flex', gap:4 }}>
                    <button onClick={() => updateUser(selectedUser,{modules:ALL_MODULES.map(m=>m.id)})} style={S.btn('rgba(34,197,94,0.08)','#22c55e')}>✅ Tous</button>
                    <button onClick={() => updateUser(selectedUser,{modules:[]})} style={S.btn('rgba(248,113,113,0.08)','#f87171')}>❌ Aucun</button>
                  </div>
                </div>
                {Object.entries(groups).map(([grp, mods]) => (
                  <div key={grp} style={{ marginBottom:8 }}>
                    <div style={{ fontSize:9, color:'#5e5c56', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>{grp}</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                      {mods.map(m => {
                        const on = (u.modules||[]).includes(m.id);
                        return (
                          <button key={m.id} onClick={() => toggleModule(selectedUser, m.id)} style={{
                            padding:'5px 10px', borderRadius:6, fontSize:10, cursor:'pointer', fontFamily:'inherit',
                            border: on ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.06)',
                            background: on ? 'rgba(34,197,94,0.08)' : 'transparent',
                            color: on ? '#22c55e' : '#5e5c56',
                          }}>{on?'✅':'⬜'} {m.icon} {m.label}</button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Clients assignés (pour commerciaux) */}
              {u.role === 'commercial' && (
                <div style={{ marginBottom:16, padding:14, background:'rgba(249,115,22,0.04)', borderRadius:10, border:'1px solid rgba(249,115,22,0.1)' }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#f97316', marginBottom:8 }}>📈 Commission: €2 / fiche de paie</div>
                  <div style={{ fontSize:11, color:'#9e9b93' }}>
                    Les fiches générées pour les clients assignés à ce commercial génèrent automatiquement une commission de €2.<br/>
                    <span style={{ color:'#22c55e' }}>🟢 Vert = client a payé → commission validée</span><br/>
                    <span style={{ color:'#eab308' }}>🟡 Jaune = en attente de paiement client</span>
                  </div>
                </div>
              )}

              {/* Zone danger */}
              <div style={{ borderTop:'1px solid rgba(248,113,113,0.15)', paddingTop:14, marginTop:14 }}>
                <button onClick={() => deleteUser(selectedUser)} style={S.btn('rgba(248,113,113,0.1)','#f87171')}>
                  🗑 Supprimer définitivement
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
