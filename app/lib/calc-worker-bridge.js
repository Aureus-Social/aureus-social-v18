// ═══════════════════════════════════════════════════════════
// CALC WORKER BRIDGE — React hook for Web Worker payroll
// Usage: const { calcSingle, calcBatch } = useCalcWorker();
// ═══════════════════════════════════════════════════════════
"use client";
import { useRef, useCallback, useEffect } from 'react';

let _reqId = 0;
const _pending = new Map();

export function useCalcWorker() {
  const workerRef = useRef(null);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      workerRef.current = new Worker('/calc-worker.js');
      workerRef.current.onmessage = (e) => {
        const { id, result, error } = e.data;
        const pending = _pending.get(id);
        if (pending) {
          _pending.delete(id);
          if (error) pending.reject(new Error(error));
          else pending.resolve(result);
        }
      };
      workerRef.current.onerror = (e) => {
        console.error('[CalcWorker] Error:', e.message);
      };
    } catch (e) {
      console.warn('[CalcWorker] Web Workers not supported, falling back to main thread');
    }
    return () => workerRef.current?.terminate();
  }, []);
  
  const send = useCallback((type, data) => {
    return new Promise((resolve, reject) => {
      const id = ++_reqId;
      _pending.set(id, { resolve, reject });
      if (workerRef.current) {
        workerRef.current.postMessage({ type, data, id });
      } else {
        reject(new Error('Worker not available'));
      }
      // Timeout 30s
      setTimeout(() => {
        if (_pending.has(id)) {
          _pending.delete(id);
          reject(new Error('Calculation timeout'));
        }
      }, 30000);
    });
  }, []);
  
  return {
    calcSingle: (employee, period, company) => send('calc_single', { employee, period, company }),
    calcBatch: (employees, period, company) => send('calc_batch', { employees, period, company }),
    calcPP: (brut, options) => send('calc_pp', { brut, options }),
    calcCSSS: (brut, situation) => send('calc_csss', { brut, situation }),
    calcBonus: (brut, type, fraction) => send('calc_bonus', { brut, type, fraction }),
    isReady: () => send('ping', {}),
  };
}

export default useCalcWorker;
