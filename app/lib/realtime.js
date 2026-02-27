// ═══════════════════════════════════════════════════════════
// Item #35 — SUPABASE REALTIME
// Push notifications when: leave request, payroll calculated,
// document signed, declaration submitted
// ═══════════════════════════════════════════════════════════
"use client";

const listeners = new Map();

export function subscribeToChannel(supabase, channel, table, event, callback) {
  if (!supabase || !supabase.channel) return null;
  const key = `${channel}-${table}-${event}`;
  if (listeners.has(key)) return listeners.get(key);
  
  const sub = supabase.channel(channel)
    .on('postgres_changes', { event, schema: 'public', table }, payload => {
      callback(payload);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED' && typeof window !== 'undefined' && window.__AUREUS_DEBUG) console.log(`[Realtime] Subscribed to ${table}:${event}`);
    });
  
  listeners.set(key, sub);
  return sub;
}

export function unsubscribeAll(supabase) {
  for (const [key, sub] of listeners) {
    supabase?.removeChannel(sub);
  }
  listeners.clear();
}

// Pre-configured subscriptions for common events
export function subscribePayroll(supabase, tenantId, onUpdate) {
  return subscribeToChannel(supabase, `payroll-${tenantId}`, 'payroll_history', 'INSERT', onUpdate);
}

export function subscribeLeaveRequests(supabase, tenantId, onUpdate) {
  return subscribeToChannel(supabase, `leaves-${tenantId}`, 'leave_requests', '*', onUpdate);
}

export function subscribeDocuments(supabase, tenantId, onUpdate) {
  return subscribeToChannel(supabase, `docs-${tenantId}`, 'documents', 'INSERT', onUpdate);
}

export function subscribeDeclarations(supabase, tenantId, onUpdate) {
  return subscribeToChannel(supabase, `decl-${tenantId}`, 'declaration_queue', 'UPDATE', onUpdate);
}
