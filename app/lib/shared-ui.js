// ═══ AUREUS SOCIAL PRO — Composants UI partages ═══
// Extraits du monolithe pour reutilisation dans les modules
"use client";
import { useContext, createContext } from "react";

// ── Language Context ──
const LangCtx = createContext({ lang: 'fr', setLang: () => {} });
export const useLang = () => useContext(LangCtx);
export { LangCtx };

// ── Card ──
export const C = ({ children, style, ...p }) => (
  <div style={{ background: "linear-gradient(145deg,#0e1220,#131829)", border: '1px solid rgba(139,115,60,.12)', borderRadius: 14, padding: 24, ...style }} {...p}>{children}</div>
);

// ── Button ──
export const B = ({ children, v = 'gold', onClick, style, ...p }) => {
  const vs = {
    gold: { background: "linear-gradient(135deg,#c6a34e,#a68a3c)", color: '#060810', fontWeight: 600, border: 'none' },
    outline: { background: "transparent", border: '1px solid rgba(139,115,60,.25)', color: '#c6a34e' },
    ghost: { background: "rgba(198,163,78,.06)", color: '#c6a34e', border: '1px solid rgba(198,163,78,.1)' },
    danger: { background: "rgba(248,113,113,.1)", color: '#f87171', border: '1px solid rgba(248,113,113,.2)' }
  };
  return <button onClick={onClick} style={{ padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', transition: 'all .15s', ...(vs[v] || vs.gold), ...style }} {...p}>{children}</button>;
};

// ── Input / Select ──
export const I = ({ label, value, onChange, type = 'text', options, span, style, ...p }) => (
  <div style={{ gridColumn: span ? `span ${span}` : undefined, ...style }}>
    {label && <label style={{ fontSize: 10.5, fontWeight: 600, color: '#9e9b93', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.7px' }}>{label}</label>}
    {options
      ? <select value={value || ''} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: "#090c16", border: '1px solid rgba(139,115,60,.15)', borderRadius: 7, color: '#d4d0c8', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', outline: 'none', boxSizing: 'border-box' }}>{options.map(o => <option key={o.v} value={o.v} style={{ background: "#0c0f1a" }}>{o.l}</option>)}</select>
      : <input type={type} value={value || ''} onChange={e => onChange(type === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value)} style={{ width: '100%', padding: '9px 12px', background: "#090c16", border: '1px solid rgba(139,115,60,.15)', borderRadius: 7, color: '#d4d0c8', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} {...p} />}
  </div>
);

// ── Section Title (with NL translation) ──
const ST_NL = {
  'Filtrer': 'Filteren', "Résumé": 'Overzicht', "Période": 'Periode', "Rémunération brute": 'Bruto verloning',
  'Cotisations ONSS': 'RSZ-bijdragen', "Avantages exonérés": 'Vrijgestelde voordelen', "Déductions": 'Inhoudingen',
  'Net à payer': 'Netto te betalen', "Coût employeur": 'Werkgeverskost',
};
export const ST = ({ children, style }) => {
  const { lang } = useLang();
  const txt = typeof children === 'string' && lang === 'nl' ? (ST_NL[children] || children) : children;
  return <div style={{ fontSize: 11.5, color: '#c6a34e', fontWeight: 600, marginBottom: 12, marginTop: 18, textTransform: 'uppercase', letterSpacing: '1.5px', ...(style || {}) }}>{txt}</div>;
};

// ── Stat Card ──
export const SC = ({ label, value, color = '#c6a34e', sub }) => (
  <C style={{ padding: '18px 16px' }}>
    <div style={{ fontSize: 10, color: '#5e5c56', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: '#5e5c56', marginTop: 3 }}>{sub}</div>}
  </C>
);

// ── Page Header (with NL translation) ──
const PH_NL = {
  'Tableau de bord': 'Dashboard', "Gestion des Employés": 'Personeelsbeheer', "Fiches de Paie": 'Loonfiches',
  'Déclarations Dimona': 'Dimona-aangiften', "Modules Pro": 'Pro Modules',
};
export const PH = ({ title, sub, actions }) => {
  const { lang } = useLang();
  const t2 = lang === 'nl' ? (PH_NL[title] || title) : title;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 26 }}>
      <div>
        <h1 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 26, fontWeight: 600, color: '#e8e6e0', margin: 0 }}>{t2}</h1>
        {sub && <p style={{ color: '#5e5c56', marginTop: 4, fontSize: 13 }}>{sub}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10 }}>{actions}</div>}
    </div>
  );
};

// ── Table ──
export function Tbl({cols,data,onRow}){return(
  <div style={{overflowX:'auto'}}>
    <table style={{width:'100%',borderCollapse:'collapse'}}>
      <thead><tr style={{borderBottom:'1px solid rgba(139,115,60,.15)'}}>
        {cols.map(c=><th key={c.k} style={{textAlign:c.a||'left',padding:'11px 14px',fontSize:10,color:'#5e5c56',textTransform:'uppercase',letterSpacing:'1px',fontWeight:600}}>{c.l}</th>)}
      </tr></thead>
      <tbody>{(data||[]).map((row,i)=>(
        <tr key={i} onClick={()=>onRow?.(row)} style={{borderBottom:'1px solid rgba(255,255,255,.03)',cursor:onRow?'pointer':'default'}}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(198,163,78,.03)'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
          {cols.map(c=><td key={c.k} style={{padding:'10px 14px',fontSize:12.5,color:c.c||'#d4d0c8',fontWeight:c.b?600:400,textAlign:c.a||'left'}}>{c.r?c.r(row):row[c.k]}</td>)}
        </tr>
      ))}</tbody>
    </table>
    {(!data||data.length===0)&&<div style={{textAlign:'center',padding:36,color:'#5e5c56',fontSize:13}}>Aucune donnée</div>}
  </div>
);}

// ── Currency formatter ──
export const fmt = n => new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(n || 0);
export const fmtNum = v => new Intl.NumberFormat('fr-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
