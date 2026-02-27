'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const FEATURES = [
  { icon: '🧮', title: 'Calcul de paie 100% belge', desc: 'Barèmes 2026, précompte SPF Finances, ONSS, bonus emploi, réductions groupe-cible. Tout est automatique.' },
  { icon: '📡', title: 'Dimona & DmfA intégrés', desc: 'Déclarations ONSS en 1 clic. Connexion directe au portail de la sécurité sociale via REST API.' },
  { icon: '📝', title: 'Contrats & Documents', desc: 'CDI, CDD, intérim, étudiant. Génération automatique conforme au droit social belge.' },
  { icon: '💸', title: 'SEPA & Virements', desc: 'Fichiers pain.001 générés automatiquement. Compatible toutes banques belges.' },
  { icon: '⚖', title: 'Veille juridique IA', desc: 'Moniteur du Belge scanné quotidiennement. Alertes automatiques sur les changements légaux.' },
  { icon: '🛡', title: 'Sécurité & RGPD', desc: 'Chiffrement AES-256, audit trail, hébergement UE (Frankfurt). Conforme RGPD.' },
  { icon: '📊', title: 'Reporting avancé', desc: 'Masse salariale, coût employeur, évolution, comparatifs sectoriels. Export PDF & Excel.' },
  { icon: '🤖', title: 'IA juridique intégrée', desc: 'Posez vos questions en droit social belge. Réponses sourcées avec références légales.' },
  { icon: '🏛', title: '38 Commissions Paritaires', desc: 'CP 200, 124, 302, 140... Barèmes sectoriels, primes, conditions spécifiques par CP.' },
  { icon: '📅', title: 'Calendrier social', desc: 'Toutes les échéances ONSS, fiscales, TVA. Alertes automatiques avant chaque deadline.' },
  { icon: '🚀', title: 'Onboarding automatisé', desc: 'Reprise de SD Worx, Securex, Partena en 7 étapes. Audit des erreurs de votre ancien prestataire.' },
  { icon: '👥', title: 'Multi-utilisateurs', desc: 'Admin, gestionnaire, commercial, client, employé. Permissions granulaires par module.' },
];

const PRICING = [
  { name: 'Starter', price: '49', period: '/mois', desc: 'Indépendants & TPE', features: ['Jusqu\'à 5 travailleurs', 'Calcul de paie complet', 'Fiches de paie PDF', 'Dimona IN/OUT', 'Support email'], cta: 'Essai gratuit 14j', popular: false },
  { name: 'Business', price: '99', period: '/mois', desc: 'PME & Fiduciaires', features: ['Jusqu\'à 50 travailleurs', 'Tout Starter +', 'DmfA trimestrielle', 'SEPA virements', 'Contrats auto-générés', 'Veille juridique IA', 'Support prioritaire'], cta: 'Essai gratuit 14j', popular: true },
  { name: 'Enterprise', price: '199', period: '/mois', desc: 'Secrétariats sociaux', features: ['Travailleurs illimités', 'Tout Business +', 'Multi-clients', 'API complète', 'Belcotax XML', 'Bilan social', 'Account manager dédié'], cta: 'Nous contacter', popular: false },
];

const COMPARATIF = [
  { feature: 'Prix / travailleur', aureus: 'Dès 9,80€', sdworx: '~25-35€', partena: '~20-30€', securex: '~22-32€' },
  { feature: 'Mise en service', aureus: '48h', sdworx: '2-4 semaines', partena: '1-3 semaines', securex: '2-3 semaines' },
  { feature: 'IA juridique', aureus: '✅ Incluse', sdworx: '❌', partena: '❌', securex: '❌' },
  { feature: 'Calcul en temps réel', aureus: '✅ Instantané', sdworx: '⏳ Batch', partena: '⏳ Batch', securex: '⏳ Batch' },
  { feature: 'Transparence tarifs', aureus: '✅ Prix fixe', sdworx: '❌ Sur devis', partena: '❌ Sur devis', securex: '❌ Sur devis' },
  { feature: 'Portail employé', aureus: '✅ Inclus', sdworx: '💰 Supplément', partena: '💰 Supplément', securex: '💰 Supplément' },
];

const FAQ = [
  { q: 'Aureus Social Pro remplace-t-il mon secrétariat social ?', a: 'Oui. Aureus Social Pro est un secrétariat social digital agréé. Nous gérons l\'intégralité de vos obligations sociales : calcul de paie, Dimona, DmfA, précompte professionnel, Belcotax, et plus encore. Tout ce que fait SD Worx ou Partena, nous le faisons — en plus rapide et moins cher.' },
  { q: 'Mes données sont-elles en sécurité ?', a: 'Absolument. Chiffrement AES-256-GCM, hébergement UE (Frankfurt), authentification 2FA, audit trail complet, et conformité RGPD native. Vos données ne quittent jamais l\'Union européenne.' },
  { q: 'Puis-je migrer depuis SD Worx, Securex ou Partena ?', a: 'Oui, notre wizard d\'onboarding en 7 étapes automatise la reprise. Nous importons vos données, recalculons en parallèle, et détectons les erreurs de votre ancien prestataire. Migration typique : 48h.' },
  { q: 'Comment fonctionne l\'IA juridique ?', a: 'Notre IA est entraînée sur l\'intégralité du droit social belge : lois, arrêtés royaux, CCT sectorielles. Elle répond à vos questions avec les références légales exactes et est mise à jour quotidiennement via le Moniteur belge.' },
  { q: 'Y a-t-il un engagement ?', a: 'Non. Tous nos plans sont sans engagement, résiliables à tout moment. Vous commencez par un essai gratuit de 14 jours, sans carte bancaire.' },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  const [visible, setVisible] = useState({});
  const refs = useRef({});

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) setVisible(p => ({ ...p, [e.target.id]: true })); });
    }, { threshold: 0.15 });
    document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const S = {
    gold: '#c6a34e',
    goldDim: 'rgba(198,163,78,0.12)',
    bg: '#060810',
    card: '#0a0d18',
    text: '#e8e6e0',
    muted: '#9e9b93',
    dim: '#5e5c56',
  };

  return (
    <div style={{ background: S.bg, color: S.text, fontFamily: "'Instrument Sans', 'DM Sans', -apple-system, sans-serif", overflowX: 'hidden' }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet" />

      {/* ═══ NAVBAR ═══ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrollY > 50 ? 'rgba(6,8,16,0.92)' : 'transparent',
        backdropFilter: scrollY > 50 ? 'blur(20px)' : 'none',
        borderBottom: scrollY > 50 ? '1px solid rgba(198,163,78,0.08)' : 'none',
        transition: 'all 0.3s ease', padding: '0 40px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #c6a34e, #a68a3c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#060810' }}>A</div>
            <span style={{ fontSize: 15, fontWeight: 700, color: S.gold, letterSpacing: 1 }}>AUREUS SOCIAL PRO</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <a href="#features" style={{ color: S.muted, textDecoration: 'none', fontSize: 13, fontWeight: 500, transition: 'color .2s' }}>Fonctionnalités</a>
            <a href="#pricing" style={{ color: S.muted, textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>Tarifs</a>
            <a href="#comparatif" style={{ color: S.muted, textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>Comparatif</a>
            <a href="#faq" style={{ color: S.muted, textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>FAQ</a>
            <Link href="/" style={{ padding: '8px 20px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(198,163,78,0.3)', color: S.gold, fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'all .2s' }}>Connexion</Link>
            <Link href="/" style={{ padding: '8px 20px', borderRadius: 8, background: 'linear-gradient(135deg, #c6a34e, #a68a3c)', color: '#060810', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Essai gratuit</Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 24px 80px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(198,163,78,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 800 }}>
          <div style={{ display: 'inline-block', padding: '6px 18px', borderRadius: 20, background: 'rgba(198,163,78,0.08)', border: '1px solid rgba(198,163,78,0.15)', fontSize: 12, color: S.gold, fontWeight: 600, marginBottom: 24, letterSpacing: 1 }}>
            🇧🇪 SECRÉTARIAT SOCIAL DIGITAL — AGRÉÉ ONSS
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 400, color: S.text, lineHeight: 1.1, margin: '0 0 24px' }}>
            La paie belge,<br /><span style={{ color: S.gold }}>simplifiée.</span>
          </h1>
          <p style={{ fontSize: 18, color: S.muted, lineHeight: 1.7, maxWidth: 560, margin: '0 auto 40px' }}>
            Calcul de paie, Dimona, DmfA, contrats, SEPA — tout automatisé.
            Moins cher que SD Worx. Plus rapide que Partena. Plus intelligent que tous.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/" style={{ padding: '16px 40px', borderRadius: 12, background: 'linear-gradient(135deg, #c6a34e, #a68a3c)', color: '#060810', fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 24px rgba(198,163,78,0.3)' }}>
              Essai gratuit 14 jours →
            </Link>
            <a href="#features" style={{ padding: '16px 40px', borderRadius: 12, background: 'transparent', border: '1px solid rgba(198,163,78,0.25)', color: S.gold, fontSize: 16, fontWeight: 600, textDecoration: 'none' }}>
              Découvrir
            </a>
          </div>
          <div style={{ display: 'flex', gap: 40, justifyContent: 'center', marginTop: 48, flexWrap: 'wrap' }}>
            {[
              { v: '500+', l: 'Entreprises cibles' },
              { v: '38', l: 'Commissions paritaires' },
              { v: '€1.3M', l: 'Revenus visés / 36 mois' },
              { v: '48h', l: 'Mise en service' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: S.gold, fontFamily: "'DM Serif Display', serif" }}>{s.v}</div>
                <div style={{ fontSize: 11, color: S.dim, marginTop: 4, letterSpacing: 1, textTransform: 'uppercase' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SOCIAL PROOF BAR ═══ */}
      <div style={{ borderTop: '1px solid rgba(198,163,78,0.06)', borderBottom: '1px solid rgba(198,163,78,0.06)', padding: '24px 0', background: 'rgba(198,163,78,0.02)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap', padding: '0 24px' }}>
          {['Prestataire ONSS agréé', 'Hébergement UE 🇪🇺', 'Conforme RGPD', 'Chiffrement AES-256', 'Support Belgique'].map((t, i) => (
            <div key={i} style={{ fontSize: 12, color: S.dim, fontWeight: 500, letterSpacing: 0.5 }}>✓ {t}</div>
          ))}
        </div>
      </div>

      {/* ═══ FEATURES ═══ */}
      <section id="features" style={{ padding: '100px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div data-animate id="feat-title" style={{ textAlign: 'center', marginBottom: 64, opacity: visible['feat-title'] ? 1 : 0, transform: visible['feat-title'] ? 'none' : 'translateY(30px)', transition: 'all 0.8s ease' }}>
          <div style={{ fontSize: 12, color: S.gold, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12, fontWeight: 600 }}>Fonctionnalités</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 400, margin: '0 0 16px', color: S.text }}>
            Tout ce dont vous avez besoin.<br /><span style={{ color: S.gold }}>Rien de superflu.</span>
          </h2>
          <p style={{ fontSize: 16, color: S.muted, maxWidth: 500, margin: '0 auto' }}>
            155 fonctionnalités pensées pour le droit social belge. Pas une adaptation d'un logiciel étranger.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {FEATURES.map((f, i) => (
            <div key={i} data-animate id={`feat-${i}`} style={{
              padding: 28, borderRadius: 16, background: 'rgba(198,163,78,0.02)', border: '1px solid rgba(198,163,78,0.06)',
              opacity: visible[`feat-${i}`] ? 1 : 0, transform: visible[`feat-${i}`] ? 'none' : 'translateY(20px)',
              transition: `all 0.6s ease ${i * 0.05}s`,
            }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: S.text, marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: S.muted, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ COMPARATIF ═══ */}
      <section id="comparatif" style={{ padding: '100px 24px', background: 'rgba(198,163,78,0.015)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div data-animate id="comp-title" style={{ textAlign: 'center', marginBottom: 48, opacity: visible['comp-title'] ? 1 : 0, transform: visible['comp-title'] ? 'none' : 'translateY(30px)', transition: 'all 0.8s ease' }}>
            <div style={{ fontSize: 12, color: S.gold, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12, fontWeight: 600 }}>Comparatif</div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 400, margin: '0 0 16px' }}>
              Pourquoi <span style={{ color: S.gold }}>nous choisir</span> ?
            </h2>
          </div>
          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(198,163,78,0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(198,163,78,0.06)' }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', color: S.dim, fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}></th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', color: S.gold, fontWeight: 700, fontSize: 13 }}>Aureus Pro</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', color: S.dim, fontWeight: 500 }}>SD Worx</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', color: S.dim, fontWeight: 500 }}>Partena</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', color: S.dim, fontWeight: 500 }}>Securex</th>
                </tr>
              </thead>
              <tbody>
                {COMPARATIF.map((r, i) => (
                  <tr key={i} style={{ borderTop: '1px solid rgba(198,163,78,0.05)' }}>
                    <td style={{ padding: '14px 20px', color: S.muted, fontWeight: 500 }}>{r.feature}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'center', color: '#22c55e', fontWeight: 600 }}>{r.aureus}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'center', color: S.dim }}>{r.sdworx}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'center', color: S.dim }}>{r.partena}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'center', color: S.dim }}>{r.securex}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" style={{ padding: '100px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div data-animate id="price-title" style={{ textAlign: 'center', marginBottom: 56, opacity: visible['price-title'] ? 1 : 0, transform: visible['price-title'] ? 'none' : 'translateY(30px)', transition: 'all 0.8s ease' }}>
          <div style={{ fontSize: 12, color: S.gold, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12, fontWeight: 600 }}>Tarifs</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 400, margin: '0 0 16px' }}>
            Transparent. <span style={{ color: S.gold }}>Sans surprise.</span>
          </h2>
          <p style={{ fontSize: 16, color: S.muted }}>14 jours d'essai gratuit. Sans carte bancaire. Sans engagement.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {PRICING.map((p, i) => (
            <div key={i} data-animate id={`price-${i}`} style={{
              padding: 36, borderRadius: 20, position: 'relative',
              background: p.popular ? 'linear-gradient(135deg, rgba(198,163,78,0.08), rgba(198,163,78,0.02))' : 'rgba(255,255,255,0.015)',
              border: p.popular ? '2px solid rgba(198,163,78,0.3)' : '1px solid rgba(255,255,255,0.06)',
              opacity: visible[`price-${i}`] ? 1 : 0, transform: visible[`price-${i}`] ? 'none' : 'translateY(20px)',
              transition: `all 0.6s ease ${i * 0.1}s`,
            }}>
              {p.popular && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', padding: '4px 16px', borderRadius: 20, background: 'linear-gradient(135deg, #c6a34e, #a68a3c)', color: '#060810', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>POPULAIRE</div>}
              <div style={{ fontSize: 14, fontWeight: 600, color: S.muted, marginBottom: 8 }}>{p.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 48, fontWeight: 700, color: p.popular ? S.gold : S.text, fontFamily: "'DM Serif Display', serif" }}>€{p.price}</span>
                <span style={{ fontSize: 14, color: S.dim }}>{p.period}</span>
              </div>
              <div style={{ fontSize: 13, color: S.dim, marginBottom: 24 }}>{p.desc}</div>
              <div style={{ marginBottom: 28 }}>
                {p.features.map((f, j) => (
                  <div key={j} style={{ display: 'flex', gap: 8, padding: '6px 0', fontSize: 13, color: S.muted }}>
                    <span style={{ color: '#22c55e' }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <Link href="/" style={{
                display: 'block', textAlign: 'center', padding: '14px 24px', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 14,
                background: p.popular ? 'linear-gradient(135deg, #c6a34e, #a68a3c)' : 'transparent',
                color: p.popular ? '#060810' : S.gold,
                border: p.popular ? 'none' : '1px solid rgba(198,163,78,0.25)',
              }}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section id="faq" style={{ padding: '100px 24px', background: 'rgba(198,163,78,0.015)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div data-animate id="faq-title" style={{ textAlign: 'center', marginBottom: 48, opacity: visible['faq-title'] ? 1 : 0, transform: visible['faq-title'] ? 'none' : 'translateY(30px)', transition: 'all 0.8s ease' }}>
            <div style={{ fontSize: 12, color: S.gold, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12, fontWeight: 600 }}>FAQ</div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 400, margin: 0 }}>
              Questions <span style={{ color: S.gold }}>fréquentes</span>
            </h2>
          </div>
          {FAQ.map((f, i) => (
            <div key={i} style={{ borderBottom: '1px solid rgba(198,163,78,0.08)', padding: '20px 0' }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{
                width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, fontFamily: 'inherit',
              }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: openFaq === i ? S.gold : S.text }}>{f.q}</span>
                <span style={{ fontSize: 20, color: S.gold, transition: 'transform .3s', transform: openFaq === i ? 'rotate(45deg)' : 'none', flexShrink: 0, marginLeft: 16 }}>+</span>
              </button>
              <div style={{ maxHeight: openFaq === i ? 300 : 0, overflow: 'hidden', transition: 'max-height 0.4s ease' }}>
                <p style={{ fontSize: 14, color: S.muted, lineHeight: 1.7, margin: '12px 0 0', paddingRight: 40 }}>{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section style={{ padding: '100px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 400, margin: '0 0 16px' }}>
            Prêt à <span style={{ color: S.gold }}>simplifier</span> votre paie ?
          </h2>
          <p style={{ fontSize: 16, color: S.muted, marginBottom: 40, lineHeight: 1.7 }}>
            Rejoignez les entreprises belges qui ont choisi l'efficacité.<br />
            14 jours gratuits. Sans engagement. Sans carte bancaire.
          </p>
          <Link href="/" style={{
            display: 'inline-block', padding: '18px 48px', borderRadius: 14,
            background: 'linear-gradient(135deg, #c6a34e, #a68a3c)', color: '#060810',
            fontSize: 18, fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 8px 32px rgba(198,163,78,0.3)',
          }}>
            Commencer gratuitement →
          </Link>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ borderTop: '1px solid rgba(198,163,78,0.06)', padding: '48px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: 40 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #c6a34e, #a68a3c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#060810' }}>A</div>
              <span style={{ fontSize: 14, fontWeight: 700, color: S.gold }}>AUREUS SOCIAL PRO</span>
            </div>
            <div style={{ fontSize: 12, color: S.dim, lineHeight: 1.8 }}>
              Aureus IA SPRL<br />
              BCE BE 1028.230.781<br />
              Saint-Gilles, Bruxelles<br />
              info@aureus-ia.com
            </div>
          </div>
          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, color: S.gold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, fontWeight: 600 }}>Produit</div>
              {['Fonctionnalités', 'Tarifs', 'Sécurité', 'API'].map((l, i) => (
                <div key={i} style={{ fontSize: 13, color: S.dim, padding: '4px 0', cursor: 'pointer' }}>{l}</div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, color: S.gold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, fontWeight: 600 }}>Légal</div>
              {['Conditions générales', 'Politique de confidentialité', 'RGPD', 'Mentions légales'].map((l, i) => (
                <div key={i} style={{ fontSize: 13, color: S.dim, padding: '4px 0', cursor: 'pointer' }}>{l}</div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, color: S.gold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, fontWeight: 600 }}>Contact</div>
              <div style={{ fontSize: 13, color: S.dim, padding: '4px 0' }}>info@aureus-ia.com</div>
              <div style={{ fontSize: 13, color: S.dim, padding: '4px 0' }}>Bruxelles, Belgique</div>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: '32px auto 0', paddingTop: 24, borderTop: '1px solid rgba(198,163,78,0.04)', textAlign: 'center', fontSize: 11, color: S.dim }}>
          © {new Date().getFullYear()} Aureus IA SPRL — Tous droits réservés
        </div>
      </footer>
    </div>
  );
}
