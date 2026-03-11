/**
 * AUREUS SOCIAL PRO — Agent IA API
 * POST /api/agent
 * 
 * Destination: app/api/agent/route.js
 * 
 * CORRIGE: Route retournait 405 Method Not Allowed (pas de handler POST)
 * AJOUTE: Handler POST avec Anthropic Claude + system prompt droit social belge
 */

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// System prompt Agent Juridique Aureus Social
const SYSTEM_PROMPT = `Tu es l'assistant juridique spécialisé d'Aureus Social Pro, la plateforme de gestion RH et payroll belge.

Tu es expert en :
- Droit social belge (228 commissions paritaires, ONSS, Dimona, DMFA)
- Contrats de travail (CDD, CDI, temps partiel, intérimaires)
- Calcul de salaire et précompte professionnel
- Procédures ONSS : Dimona IN/OUT, DMFA trimestrielle
- RGPD et protection des données sociales
- Réglementation Belcotax-on-web
- Commissions paritaires et CCT

Règles :
- Réponds TOUJOURS en français (sauf si question en néerlandais → répondre en néerlandais)
- Sois précis, cite les articles de loi si pertinent
- Si incertain, indique-le clairement
- Ne donne pas de conseil juridique définitif — recommande un juriste pour les cas complexes
- Format : réponses concises, structurées, avec des listes si nécessaire`;

export async function POST(request) {
  try {
    const body = await request.json();
    const { message, history = [], context = '' } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message requis' }, { status: 400 });
    }

    // Vérifier la clé API Anthropic
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Agent IA non configuré — ANTHROPIC_API_KEY manquante' },
        { status: 503 }
      );
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Construire l'historique de conversation
    const messages = [
      // Inclure le contexte utilisateur si fourni
      ...(context ? [{ role: 'user', content: `Contexte: ${context}` }, { role: 'assistant', content: 'Compris, je prends en compte votre contexte.' }] : []),
      // Historique de la conversation
      ...history.slice(-10), // Max 10 derniers messages pour limiter les tokens
      // Message actuel
      { role: 'user', content: message },
    ];

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const reply = response.content[0]?.text || 'Réponse indisponible';

    return NextResponse.json({
      reply,
      usage: response.usage,
    });

  } catch (err) {
    console.error('[/api/agent] Error:', err?.message);
    
    if (err?.status === 401) {
      return NextResponse.json({ error: 'Clé API invalide' }, { status: 503 });
    }
    if (err?.status === 429) {
      return NextResponse.json({ error: 'Limite de requêtes atteinte, réessayez dans quelques secondes' }, { status: 429 });
    }

    return NextResponse.json(
      { error: 'Erreur interne de l\'agent' },
      { status: 500 }
    );
  }
}

// ─── OPTIONS pour CORS si besoin
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'POST, OPTIONS',
    },
  });
}
