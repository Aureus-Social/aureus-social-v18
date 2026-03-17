'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';

const GOLD = '#c6a34e';
const GREEN = '#22c55e';

const STEPS = [
  { id: 1, label: 'Bienvenue', icon: '👋' },
  { id: 2, label: 'Votre entreprise', icon: '🏢' },
  { id: 3, label: 'Premier employe', icon: '👤' },
  { id: 4, label: "C'est parti !", icon: '🚀' },
];

export default function OnboardingClient({ user, onComplete }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [co, setCo] = useState({
    nom: '', bce: '', onss: '', adresse: '', email: user?.email || '',
    cp: '200', iban: '',
  });
  const [emp, setEmp] = useState({
    prenom: '', nom: '', niss: '', brut: '', email: '', dateEntree: '',
    contrat: 'cdi', cp: '200',
  });

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)',
    color: '#e8e6e0', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
  };

  const saveStep2 = async () => {
    if (!co.nom) return alert('Le nom est requis');
    setSaving(true);
    if (supabase && user?.id) {
      await supabase.from('entreprises').upsert([{
        user_id: user.id,
        nom: co.nom, name: co.nom,
        bce: co.bce, vat: co.bce,
        matricule_onss: co.onss, onss: co.onss,
        adresse: co.adresse, address: co.adresse,
        email: co.email, iban: co.iban,
        commission_paritaire: co.cp,
        updated_at: new Date().toISOString(),
      }], { onConflict: 'user_id' });
    }
    setSaving(false);
    setStep(3);
  };

  const saveStep3 = async () => {
    setSaving(true);
    if (supabase && user?.id && emp.prenom && emp.nom) {
      await supabase.from('employes').insert([{
        user_id: user.id,
        first: emp.prenom, last: emp.nom, prenom: emp.prenom, nom_emp: emp.nom,
        niss: emp.niss, email: emp.email,
        monthlySalary: parseFloat(emp.brut) || 0,
        gross: parseFloat(emp.brut) || 0,
        startD: emp.dateEntree, date_entree: emp.dateEntree,
        contract: emp.contrat,
        commission_paritaire: emp.cp, cp: emp.cp,
        status: 'active',
        created_at: new Date().toISOString(),
      }]);
    }
    setSaving(false);
    setStep(4);
  };

  const markOnboardingDone = async () => {
    if (supabase && user?.id) {
      await supabase.from('app_state').upsert([{
        key: `onboarding_done_${user.id}`,
        val: 'true',
        updated_at: new Date().toISOString(),
      }]);
    }
    onComplete?.();
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0c0b09',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 600 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: GOLD, letterSpacing: 2 }}>AUREUS</div>
          <div style={{ fontSize: 12, color: '#5e5c56', marginTop: 4 }}>Social Pro</div>
        </div>

        {/* Progress steps */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: step > s.id ? 16 : 13, fontWeight: 700,
                background: step > s.id ? GREEN : (step === s.id ? GOLD : 'rgba(255,255,255,.06)'),
                color: step >= s.id ? '#000' : '#5e5c56',
                transition: 'all .3s',
              }}>
                {step > s.id ? '✓' : s.icon}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  flex: 1, height: 2, margin: '0 6px',
                  background: step > s.id ? GREEN : 'rgba(255,255,255,.06)',
                  transition: 'background .3s',
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Contenu */}
        <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,.08)', padding: 32 }}>

          {/* STEP 1 — Bienvenue */}
          {step === 1 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
              <h2 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 700, color: GOLD }}>
                Bienvenue sur Aureus Social Pro
              </h2>
              <p style={{ color: '#9e9b93', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
                Votre espace est pret. En 2 minutes, vous allez configurer votre entreprise
                et ajouter votre premier travailleur. Toutes vos donnees seront sauvegardees
                automatiquement a chaque connexion.
              </p>
              <div style={{ display: 'grid', gap: 10, marginBottom: 28 }}>
                {[
                  { i: '🏢', t: 'Votre entreprise', d: 'BCE, ONSS, coordonnees' },
                  { i: '👥', t: 'Vos travailleurs', d: 'Fiches employees persistantes' },
                  { i: '💰', t: 'Fiches de paie', d: 'Generees et sauvegardees' },
                  { i: '📤', t: 'Dimona automatique', d: 'Declarations ONSS simplifiees' },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 12, alignItems: 'center', padding: '10px 14px',
                    background: 'rgba(255,255,255,.02)', borderRadius: 8, textAlign: 'left',
                  }}>
                    <span style={{ fontSize: 20 }}>{item.i}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{item.t}</div>
                      <div style={{ fontSize: 11, color: '#5e5c56' }}>{item.d}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setStep(2)} style={{
                width: '100%', padding: '14px', borderRadius: 10, border: 'none',
                background: 'rgba(198,163,78,.2)', color: GOLD,
                cursor: 'pointer', fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
              }}>
                Commencer la configuration →
              </button>
            </div>
          )}

          {/* STEP 2 — Entreprise */}
          {step === 2 && (
            <div>
              <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: GOLD }}>
                🏢 Votre entreprise
              </h3>
              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#9e9b93', display: 'block', marginBottom: 6 }}>Nom de l’entreprise *</label>
                  <input value={co.nom} onChange={e => setCo(c => ({ ...c, nom: e.target.value }))}
                    placeholder="Ma Societe SPRL" style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#9e9b93', display: 'block', marginBottom: 6 }}>Numero BCE</label>
                    <input value={co.bce} onChange={e => setCo(c => ({ ...c, bce: e.target.value }))}
                      placeholder="BE 0123.456.789" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#9e9b93', display: 'block', marginBottom: 6 }}>Matricule ONSS</label>
                    <input value={co.onss} onChange={e => setCo(c => ({ ...c, onss: e.target.value }))}
                      placeholder="123456789" style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#9e9b93', display: 'block', marginBottom: 6 }}>Adresse</label>
                  <input value={co.adresse} onChange={e => setCo(c => ({ ...c, adresse: e.target.value }))}
                    placeholder="Rue de la Paix 1, 1000 Bruxelles" style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#9e9b93', display: 'block', marginBottom: 6 }}>Email</label>
                    <input type="email" value={co.email} onChange={e => setCo(c => ({ ...c, email: e.target.value }))}
                      style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#9e9b93', display: 'block', marginBottom: 6 }}>Commission paritaire</label>
                    <select value={co.cp} onChange={e => setCo(c => ({ ...c, cp: e.target.value }))}
                      style={{ ...inputStyle }}>
                      {['200', '118', '119', '140', '149', '200', '218', '226', '302', '330'].map(cp => (
                        <option key={cp} value={cp}>CP {cp}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => setStep(1)} style={{
                  padding: '12px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)',
                  background: 'transparent', color: '#9e9b93', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                }}>← Retour</button>
                <button onClick={saveStep2} disabled={saving || !co.nom} style={{
                  flex: 1, padding: '12px', borderRadius: 10, border: 'none',
                  background: co.nom ? 'rgba(198,163,78,.2)' : 'rgba(255,255,255,.03)',
                  color: co.nom ? GOLD : '#5e5c56',
                  cursor: co.nom ? 'pointer' : 'not-allowed', fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                }}>
                  {saving ? 'Sauvegarde...' : 'Sauvegarder et continuer →'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Premier employe */}
          {step === 3 && (
            <div>
              <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: GOLD }}>👤 Premier travailleur</h3>
              <p style={{ color: '#9e9b93', fontSize: 12, marginBottom: 20 }}>
                Vous pouvez en ajouter d'autres plus tard dans Travailleurs
              </p>
              <div style={{ display: 'grid', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#9e9b93', display: 'block', marginBottom: 6 }}>Prenom *</label>
                    <input value={emp.prenom} onChange={e => setEmp(m => ({ ...m, prenom: e.target.value }))}
                      placeholder="Jean" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#9e9b93', display: 'block', marginBottom: 6 }}>Nom *</label>
                    <input value={emp.nom} onChange={e => setEmp(m => ({ ...m, nom: e.target.value }))}
                      placeholder="Dupont" style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#9e9b93', display: 'block', marginBottom: 6 }}>NISS</label>
                    <input value={emp.niss} onChange={e => setEmp(m => ({ ...m, niss: e.target.value }))}
                      placeholder="00.00.00-000-00" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#9e9b93', display: 'block', marginBottom: 6 }}>Salaire brut (EUR)</label>
                    <input type="number" value={emp.brut} onChange={e => setEmp(m => ({ ...m, brut: e.target.value }))}
                      placeholder="2500" style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#9e9b93', display: 'block', marginBottom: 6 }}>Date entree</label>
                    <input type="date" value={emp.dateEntree} onChange={e => setEmp(m => ({ ...m, dateEntree: e.target.value }))}
                      style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#9e9b93', display: 'block', marginBottom: 6 }}>Contrat</label>
                    <select value={emp.contrat} onChange={e => setEmp(m => ({ ...m, contrat: e.target.value }))}
                      style={inputStyle}>
                      <option value="cdi">CDI</option>
                      <option value="cdd">CDD</option>
                      <option value="student">Etudiant</option>
                      <option value="flexi">Flexi-job</option>
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => setStep(2)} style={{
                  padding: '12px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)',
                  background: 'transparent', color: '#9e9b93', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                }}>← Retour</button>
                <button onClick={saveStep3} disabled={saving} style={{
                  flex: 1, padding: '12px', borderRadius: 10, border: 'none',
                  background: 'rgba(198,163,78,.2)', color: GOLD,
                  cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                }}>
                  {saving ? 'Sauvegarde...' : (emp.prenom && emp.nom ? 'Sauvegarder →' : 'Passer cette etape →')}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 — C'est parti */}
          {step === 4 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🚀</div>
              <h2 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 700, color: GREEN }}>
                Tout est pret !
              </h2>
              <p style={{ color: '#9e9b93', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
                Votre espace Aureus Social Pro est configure. Toutes vos donnees
                sont sauvegardees en securite et vous les retrouverez a chaque connexion.
              </p>
              <div style={{ display: 'grid', gap: 8, marginBottom: 28, textAlign: 'left' }}>
                {[
                  '✅ Entreprise configuree et sauvegardee',
                  emp.prenom && emp.nom ? `✅ ${emp.prenom} ${emp.nom} ajoute comme travailleur` : '⏭️ Travailleur a ajouter depuis Travailleurs',
                  '✅ Toutes vos donnees persistent entre les sessions',
                  '✅ Dimona, fiches de paie, alertes legales actifs',
                ].map((line, i) => (
                  <div key={i} style={{ fontSize: 13, color: line.startsWith('✅') ? GREEN : '#9e9b93', padding: '8px 12px', background: 'rgba(255,255,255,.02)', borderRadius: 6 }}>
                    {line}
                  </div>
                ))}
              </div>
              <button onClick={markOnboardingDone} style={{
                width: '100%', padding: '14px', borderRadius: 10, border: 'none',
                background: 'rgba(34,197,94,.2)', color: GREEN,
                cursor: 'pointer', fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
              }}>
                Acceder a mon tableau de bord →
              </button>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#5e5c56' }}>
          Aureus Social Pro · Secretariat social digital belge
        </div>
      </div>
    </div>
  );
}
