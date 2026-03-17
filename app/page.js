'use client';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import LoginPage from './(auth)/login';
import DashboardLayout from './(dashboard)/layout-client';
import dynamic from 'next/dynamic';

const OnboardingClient = dynamic(() => import('./pages/OnboardingClient'), { ssr: false });

// Emails admin qui n'ont pas besoin d'onboarding
const ADMIN_EMAILS = ['moussati.nourdin@gmail.com', 'info@aureus-ia.com', 'nourdin@aureus-ia.com'];

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      if (!supabase) {
        setLoading(false);
        setUser({ email: 'demo@aureus-ia.com', role: 'admin' });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);

      // Verifier si premiere connexion (onboarding requis)
      if (currentUser && !ADMIN_EMAILS.includes(currentUser.email)) {
        const { data } = await supabase
          .from('app_state')
          .select('val')
          .eq('key', `onboarding_done_${currentUser.id}`)
          .limit(1);

        const onboardingDone = data?.[0]?.val === 'true';

        // Verifier aussi si l'entreprise est deja configuree
        if (!onboardingDone) {
          const { data: entreprise } = await supabase
            .from('entreprises')
            .select('nom')
            .eq('user_id', currentUser.id)
            .limit(1);

          const hasEntreprise = entreprise?.[0]?.nom && entreprise[0].nom.length > 0;
          setNeedsOnboarding(!hasEntreprise);
        }
      }

      setLoading(false);

      supabase.auth.onAuthStateChange(async (_event, session) => {
        const u = session?.user || null;
        setUser(u);
        if (u && !ADMIN_EMAILS.includes(u.email)) {
          const { data } = await supabase
            .from('app_state')
            .select('val')
            .eq('key', `onboarding_done_${u.id}`)
            .limit(1);
          if (!data?.[0]) {
            const { data: ent } = await supabase.from('entreprises').select('nom').eq('user_id', u.id).limit(1);
            setNeedsOnboarding(!ent?.[0]?.nom);
          }
        } else {
          setNeedsOnboarding(false);
        }
      });
    }
    checkAuth();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0c0b09' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#c6a34e', letterSpacing: '2px' }}>AUREUS</div>
        <div style={{ fontSize: 11, color: '#5e5c56', marginTop: 4 }}>Chargement...</div>
      </div>
    </div>
  );

  if (!user) return <LoginPage onLogin={(u) => setUser(u)} />;

  // Premiere connexion client → onboarding
  if (needsOnboarding) {
    return (
      <OnboardingClient
        user={user}
        onComplete={() => setNeedsOnboarding(false)}
      />
    );
  }

  return <DashboardLayout user={user} />;
}
