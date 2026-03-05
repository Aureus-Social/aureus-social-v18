export const metadata = {
  title: 'Aureus Social Pro — Gestion de Paie Belge',
  description: 'Secrétariat social digital pour PME belges',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "'Inter',system-ui,sans-serif", background: '#0c0b09', color: '#e8e6e0', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  );
}
