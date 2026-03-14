// ═══ AUREUS SOCIAL PRO — useSupabaseSync Hook ═══
// Hook centralisé pour sync Supabase depuis les composants
// Usage: const { save, load, remove } = useSupabaseSync('employes', userId)
'use client';
import { useState, useCallback } from 'react';
import { supabase } from './supabase';

/**
 * Hook universel pour opérations CRUD Supabase
 * @param {string} table - Nom de la table Supabase
 * @param {string} userId - ID utilisateur connecté
 */
export function useSupabaseSync(table, userId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (filters = {}, options = {}) => {
    if (!supabase || !userId) return [];
    setLoading(true); setError(null);
    try {
      let q = supabase.from(table).select(options.select || '*').eq('user_id', userId);
      Object.entries(filters).forEach(([k, v]) => { q = q.eq(k, v); });
      if (options.order) q = q.order(options.order, { ascending: options.asc ?? false });
      if (options.limit) q = q.limit(options.limit);
      const { data, error: err } = await q;
      if (err) { setError(err.message); return []; }
      return data || [];
    } catch (e) { setError(e.message); return []; }
    finally { setLoading(false); }
  }, [table, userId]);

  const save = useCallback(async (record, upsertKeys = null) => {
    if (!supabase || !userId) return null;
    setLoading(true); setError(null);
    try {
      const data_in = { ...record, user_id: userId };
      let q;
      if (upsertKeys) {
        q = supabase.from(table).upsert([data_in], { onConflict: upsertKeys });
      } else if (record.id) {
        const { id, user_id, ...updates } = data_in;
        q = supabase.from(table).update(updates).eq('id', id).eq('user_id', userId);
      } else {
        q = supabase.from(table).insert([data_in]);
      }
      const { data, error: err } = await q.select().single();
      if (err) { setError(err.message); return null; }
      return data;
    } catch (e) { setError(e.message); return null; }
    finally { setLoading(false); }
  }, [table, userId]);

  const remove = useCallback(async (id) => {
    if (!supabase || !userId || !id) return false;
    setLoading(true); setError(null);
    try {
      const { error: err } = await supabase.from(table).delete().eq('id', id).eq('user_id', userId);
      if (err) { setError(err.message); return false; }
      return true;
    } catch (e) { setError(e.message); return false; }
    finally { setLoading(false); }
  }, [table, userId]);

  const count = useCallback(async (filters = {}) => {
    if (!supabase || !userId) return 0;
    try {
      let q = supabase.from(table).select('id', { count: 'exact', head: true }).eq('user_id', userId);
      Object.entries(filters).forEach(([k, v]) => { q = q.eq(k, v); });
      const { count: c, error: err } = await q;
      return err ? 0 : (c || 0);
    } catch { return 0; }
  }, [table, userId]);

  return { load, save, remove, count, loading, error };
}

/**
 * Charger et mettre à jour une seule entité (ex: entreprise)
 */
export function useSupabaseSingle(table, userId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!supabase || !userId) return;
    setLoading(true);
    const { data: d } = await supabase.from(table).select('*').eq('user_id', userId).limit(1).single();
    setLoading(false);
    if (d) setData(d);
  }, [table, userId]);

  const save = useCallback(async (updates) => {
    if (!supabase || !userId) return;
    setLoading(true);
    const { data: d } = await supabase.from(table)
      .upsert([{ ...updates, user_id: userId }], { onConflict: 'user_id' })
      .select().single();
    setLoading(false);
    if (d) setData(d);
    return d;
  }, [table, userId]);

  return { data, load, save, loading };
}

/**
 * Realtime subscription pour une table
 */
export function useSupabaseRealtime(table, userId, callback) {
  const subscribe = useCallback(() => {
    if (!supabase || !userId) return null;
    const channel = supabase.channel(`${table}_${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table,
        filter: `user_id=eq.${userId}`,
      }, callback)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [table, userId, callback]);

  return { subscribe };
}
