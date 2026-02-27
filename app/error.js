'use client';

export default function Error({ error, reset }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#060810',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ maxWidth: 600, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ color: '#e5e5e5', fontSize: 20, marginBottom: 8 }}>
          Erreur Application
        </h2>
        <pre style={{
          color: '#ef4444',
          fontSize: 12,
          background: 'rgba(239,68,68,0.05)',
          border: '1px solid rgba(239,68,68,0.15)',
          borderRadius: 8,
          padding: 16,
          textAlign: 'left',
          overflow: 'auto',
          maxHeight: 300,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}>
          {error?.message || 'Unknown error'}
          {'\n\n'}
          {error?.stack || ''}
        </pre>
        <button
          onClick={() => reset()}
          style={{
            marginTop: 16,
            padding: '12px 28px',
            borderRadius: 10,
            border: '1px solid rgba(198,163,78,0.2)',
            background: 'transparent',
            color: '#c6a34e',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
