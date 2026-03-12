// app/api/onss/status/route.js
import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const test = searchParams.get('test');

  // Vérification variables d'environnement ONSS
  const hasONSSKey = !!process.env.ONSS_API_KEY;
  const hasONSSUrl = !!process.env.ONSS_API_URL;
  const matricule = process.env.ONSS_MATRICULE || '51357716-02';

  const readiness = {
    oauthToken: hasONSSKey,
    apiUrl: hasONSSUrl,
    matricule: !!matricule,
    configured: hasONSSKey && hasONSSUrl,
  };

  // Mode test — vérifier connexion réelle si token présent
  if (test && hasONSSKey) {
    try {
      const resp = await fetch(`${process.env.ONSS_API_URL}/health`, {
        headers: { 'Authorization': `Bearer ${process.env.ONSS_API_KEY}` },
        signal: AbortSignal.timeout(5000),
      });
      readiness.oauthToken = resp.ok;
    } catch (e) {
      readiness.oauthToken = false;
      readiness.oauthError = e.message;
    }
  }

  return NextResponse.json({
    ok: true,
    mode: hasONSSKey ? 'production' : 'simulation',
    readiness,
    configuration: {
      matricule,
      apiUrl: hasONSSUrl ? process.env.ONSS_API_URL : null,
      oauthError: readiness.oauthError || null,
    },
    message: hasONSSKey
      ? 'Connexion ONSS configurée'
      : 'Mode simulation — Configurez ONSS_API_KEY et ONSS_API_URL dans les variables d\'environnement Vercel',
  });
}
