import './responsive.css';

export const metadata = {
  title: 'Aureus Social Pro — Gestion de Paie Belge',
  description: 'Logiciel professionnel de gestion de paie et secrétariat social pour la Belgique — Aureus IA SPRL',
  manifest: '/manifest.json',
  themeColor: '#c6a34e',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AureusPro',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#c6a34e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AureusPro" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="AureusPro" />
        <meta name="msapplication-TileColor" content="#060810" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <a href="#main-content" className="skip-link">Aller au contenu</a>
        <div id="toast-container" className="toast-stack"></div>
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          // ── PWA: Service Worker + Install Prompt + Push ──
          var _deferredPrompt = null;
          var _swRegistration = null;
          var VAPID_PUBLIC = 'BEzikUSdbDX7h86TxD0PmRFcjeuroq6E2B7ZUJkJVOveZRqVIfKwj-FrHHNdsBVCuv-0zAhfunHVbPKvxdtQgVk';
          
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js')
                .then(reg => {
                  _swRegistration = reg;
                  if(location.hostname==='localhost') console.log('[PWA] SW registered:', reg.scope);
                  setInterval(() => reg.update(), 30 * 60 * 1000);
                  
                  // Auto-subscribe to push if permission granted
                  if (Notification.permission === 'granted') {
                    _subscribePush(reg);
                  }
                })
                .catch(err => console.warn('[PWA] SW failed:', err));
            });
          }
          
          // Install prompt
          window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            _deferredPrompt = e;
            if(location.hostname==='localhost') console.log('[PWA] Install prompt ready');
            window.dispatchEvent(new CustomEvent('pwa-installable'));
          });
          
          window.addEventListener('appinstalled', () => {
            _deferredPrompt = null;
            if(location.hostname==='localhost') console.log('[PWA] Installed!');
            window.dispatchEvent(new CustomEvent('pwa-installed'));
          });
          
          // Install trigger
          window.installPWA = async () => {
            if (!_deferredPrompt) return false;
            _deferredPrompt.prompt();
            const r = await _deferredPrompt.userChoice;
            _deferredPrompt = null;
            return r.outcome === 'accepted';
          };
          
          // Check if already installed
          window.isPWAInstalled = () => {
            return window.matchMedia('(display-mode: standalone)').matches
              || window.navigator.standalone === true;
          };
          
          // Push subscription
          function _urlBase64ToUint8Array(base64String) {
            var padding = '='.repeat((4 - base64String.length % 4) % 4);
            var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
            var raw = atob(base64);
            var arr = new Uint8Array(raw.length);
            for (var i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
            return arr;
          }
          
          async function _subscribePush(reg) {
            try {
              var sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: _urlBase64ToUint8Array(VAPID_PUBLIC)
              });
              // Send to server
              await fetch('/api/push?action=subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription: sub.toJSON() })
              });
              if(location.hostname==='localhost') console.log('[PWA] Push subscribed');
              return sub;
            } catch(e) {
              console.warn('[PWA] Push failed:', e.message);
              return null;
            }
          }
          
          // Request push permission
          window.requestPushPermission = async () => {
            if (!('Notification' in window)) return 'unsupported';
            var perm = await Notification.requestPermission();
            if (perm === 'granted' && _swRegistration) {
              await _subscribePush(_swRegistration);
            }
            return perm;
          };
          
          // Send local notification (for testing)
          window.sendTestNotification = (title, body) => {
            if (Notification.permission === 'granted') {
              new Notification(title || 'Aureus Social Pro', {
                body: body || 'Notification de test',
                icon: '/icon-192.png',
                badge: '/favicon-32.png',
              });
            }
          };
          
          // Geo-IP for security
          window._geoInfo = null;
          fetch('https://ipapi.co/json/').then(r=>r.json()).then(d=>{
            window._geoInfo = { ip: d.ip, country: d.country_code, city: d.city, region: d.region, org: d.org };
          }).catch(()=>{});
          
          // Online/offline indicator
          window.addEventListener('online', () => {
            document.dispatchEvent(new CustomEvent('connection-change', { detail: { online: true } }));
          });
          window.addEventListener('offline', () => {
            document.dispatchEvent(new CustomEvent('connection-change', { detail: { online: false } }));
          });
        `}} />
      </body>
    </html>
  )
}
