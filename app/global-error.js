'use client';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, padding: 0, background: '#060810' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
          fontFamily: "system-ui, sans-serif",
        }}>
          <div style={{ maxWidth: 600, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💥</div>
            <h2 style={{ color: '#e5e5e5', fontSize: 20, marginBottom: 8 }}>
              Erreur Critique
            </h2>
            <pre style={{
              color: '#ef4444',
              fontSize: 11,
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
                border: 'none',
                background: '#c6a34e',
                color: '#060810',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Recharger
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
