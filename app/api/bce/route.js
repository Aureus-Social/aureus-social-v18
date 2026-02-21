// ═══ API /api/bce — Lookup BCE/KBO belge complet ═══
// Retourne: nom, forme juridique, adresse, codes NACE, statut, date création
// Source: KBO Public Search (SPF Economie)
// 🔒 Protégé: requiert token Supabase valide (Authorization: Bearer <token>)

export const runtime = 'edge'; // Vercel Edge = rapide + pas de cold start

// ═══ AUTH MIDDLEWARE — Vérifie le token JWT Supabase ═══
async function verifyAuth(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { ok: false, error: 'Token manquant' };
  }
  const token = authHeader.replace('Bearer ', '');
  
  // Vérifier le JWT avec Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    // En dev sans Supabase configuré, on laisse passer
    return { ok: true, userId: 'dev-mode' };
  }
  
  try {
    const resp = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseKey,
      },
      signal: AbortSignal.timeout(5000),
    });
    
    if (!resp.ok) return { ok: false, error: 'Token invalide ou expiré' };
    
    const user = await resp.json();
    if (!user || !user.id) return { ok: false, error: 'Utilisateur non trouvé' };
    
    return { ok: true, userId: user.id, email: user.email };
  } catch (e) {
    return { ok: false, error: 'Erreur vérification auth: ' + e.message };
  }
}

// ═══ RATE LIMITER — Simple en mémoire (reset au redéploiement) ═══
const rateLimitMap = new Map();
const RATE_LIMIT = 60; // requêtes max par minute par IP
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.start > RATE_WINDOW) {
    rateLimitMap.set(ip, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT) return false;
  return true;
}

export async function GET(request) {
  // 🔒 Rate limiting
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  if (!checkRateLimit(ip)) {
    return Response.json({ found: false, error: 'Trop de requêtes — réessayez dans 1 minute' }, { 
      status: 429, 
      headers: { 'Retry-After': '60' }
    });
  }
  
  // 🔒 Auth — vérifier le token Supabase
  const auth = await verifyAuth(request);
  if (!auth.ok) {
    return Response.json({ found: false, error: 'Non autorisé: ' + auth.error }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const vat = (searchParams.get('vat') || '').replace(/[^0-9]/g, '');
  
  if (!vat || vat.length < 9 || vat.length > 10) {
    return Response.json({ found: false, error: 'Numéro BCE invalide' }, { status: 400 });
  }
  
  const nr = vat.padStart(10, '0');
  const formatted = `${nr.slice(0,4)}.${nr.slice(4,7)}.${nr.slice(7,10)}`;
  
  try {
    // ═══ 1. KBO Public Search — HTML parsing ═══
    const kboUrl = `https://kbopub.economie.fgov.be/kbopub/zoeknummerform.html?nummer=${nr}&actionLu=Recherche`;
    const resp = await fetch(kboUrl, {
      headers: {
        'User-Agent': 'AureusSocialPro/1.0 (Belgian Payroll SaaS)',
        'Accept': 'text/html',
        'Accept-Language': 'fr-BE,fr;q=0.9',
      },
      signal: AbortSignal.timeout(8000),
    });
    
    if (!resp.ok) throw new Error(`KBO HTTP ${resp.status}`);
    const html = await resp.text();
    
    // ═══ Parse le HTML KBO ═══
    const result = parseKBOHtml(html, nr, formatted);
    
    if (result.found) {
      // ═══ 2. Détecter CP depuis NACE ═══
      result.detectedCP = detectCPFromNACE(result.nace || []);
      result.source = 'KBO';
      return Response.json(result);
    }
    
    // Pas trouvé dans KBO
    return Response.json({ 
      found: false, 
      vat: `BE ${formatted}`, 
      bce: nr,
      message: 'Entreprise non trouvée dans la BCE' 
    });
    
  } catch (err) {
    // ═══ 3. Fallback: validation modulo 97 ═══
    const main = parseInt(nr.substring(0, 8));
    const chk = parseInt(nr.substring(8, 10));
    const valid = (97 - (main % 97)) === chk;
    
    return Response.json({
      found: false,
      vat: `BE ${formatted}`,
      bce: nr,
      validBCE: valid,
      error: err.message,
      message: valid 
        ? 'N° BCE valide mais KBO injoignable — Complétez manuellement'
        : 'N° BCE invalide — Vérifiez le numéro',
    });
  }
}

// ═══ PARSER HTML KBO ═══
function parseKBOHtml(html, nr, formatted) {
  const result = {
    found: false,
    vat: `BE ${formatted}`,
    bce: nr,
    name: '',
    forme: '',
    formeCode: '',
    addr: '',
    address: '',
    zip: '',
    city: '',
    nace: [],
    naceDetails: [],
    activity: '',
    status: '',
    startDate: '',
    phone: '',
    email: '',
    web: '',
  };
  
  // Vérifier si la page contient des données
  if (html.includes('Aucun résultat') || html.includes('Geen resultaat') || !html.includes('entityname')) {
    // Essayer le format alternatif
    if (!html.includes('<td') && !html.includes('content')) {
      return result;
    }
  }
  
  // ═══ Nom de l'entreprise ═══
  // KBO affiche le nom dans plusieurs formats possibles
  const namePatterns = [
    /<td[^>]*id="[^"]*entityname[^"]*"[^>]*>(.*?)<\/td>/is,
    /Dénomination[^<]*<\/[^>]+>\s*<[^>]+>(.*?)<\//is,
    /Benaming[^<]*<\/[^>]+>\s*<[^>]+>(.*?)<\//is,
    /<h2[^>]*>(.*?)<\/h2>/is,
    /class="[^"]*name[^"]*"[^>]*>(.*?)<\//is,
  ];
  for (const pat of namePatterns) {
    const m = html.match(pat);
    if (m && m[1] && m[1].trim().length > 2) {
      result.name = cleanHtml(m[1]).trim();
      result.found = true;
      break;
    }
  }
  
  // ═══ Forme juridique ═══
  const formePatterns = [
    /Forme\s*juridique[^<]*<\/[^>]+>\s*<[^>]+>(.*?)<\//is,
    /Rechtsvorm[^<]*<\/[^>]+>\s*<[^>]+>(.*?)<\//is,
    /juridique[^>]*>[^<]*<[^>]+>(.*?)<\//is,
  ];
  for (const pat of formePatterns) {
    const m = html.match(pat);
    if (m && m[1]) {
      const raw = cleanHtml(m[1]).trim();
      result.formeCode = raw;
      result.forme = detectForme(raw);
      break;
    }
  }
  if (!result.forme && result.name) {
    result.forme = detectFormeFromName(result.name);
  }
  
  // ═══ Adresse ═══
  const addrPatterns = [
    /Adresse[^<]*<\/[^>]+>\s*<[^>]+>(.*?)<\/td>/is,
    /Adres[^<]*<\/[^>]+>\s*<[^>]+>(.*?)<\/td>/is,
    /class="[^"]*address[^"]*"[^>]*>(.*?)<\/td>/is,
  ];
  for (const pat of addrPatterns) {
    const m = html.match(pat);
    if (m && m[1]) {
      const raw = cleanHtml(m[1]).replace(/\s+/g, ' ').trim();
      result.addr = raw;
      const zipMatch = raw.match(/(\d{4})\s+([A-ZÀ-Ü][a-zà-ü\-\s]+)/);
      if (zipMatch) {
        result.zip = zipMatch[1];
        result.city = zipMatch[2].trim();
        result.address = raw.replace(zipMatch[0], '').replace(/,?\s*$/, '').trim();
      } else {
        result.address = raw;
      }
      break;
    }
  }
  
  // ═══ Codes NACE ═══
  const naceRegex = /(\d{2}\.\d{3})\s*[-–]\s*([^<\n]+)/g;
  let naceMatch;
  while ((naceMatch = naceRegex.exec(html)) !== null) {
    const code = naceMatch[1];
    const desc = cleanHtml(naceMatch[2]).trim();
    if (!result.nace.includes(code)) {
      result.nace.push(code);
      result.naceDetails.push({ code, desc });
    }
  }
  // Fallback: codes NACE format alternatif (5 chiffres sans point)
  if (result.nace.length === 0) {
    const naceAlt = /NACE[^:]*:\s*(\d{5})/g;
    let m2;
    while ((m2 = naceAlt.exec(html)) !== null) {
      const code = m2[1].slice(0,2) + '.' + m2[1].slice(2);
      if (!result.nace.includes(code)) {
        result.nace.push(code);
        result.naceDetails.push({ code, desc: '' });
      }
    }
  }
  if (result.naceDetails.length > 0) {
    result.activity = result.naceDetails[0].desc;
  }
  
  // ═══ Statut ═══
  const statusPatterns = [
    /Statut[^<]*<\/[^>]+>\s*<[^>]+>(.*?)<\//is,
    /Status[^<]*<\/[^>]+>\s*<[^>]+>(.*?)<\//is,
    /Toestand[^<]*<\/[^>]+>\s*<[^>]+>(.*?)<\//is,
  ];
  for (const pat of statusPatterns) {
    const m = html.match(pat);
    if (m && m[1]) {
      result.status = cleanHtml(m[1]).trim();
      break;
    }
  }
  
  // ═══ Date de début ═══
  const datePatterns = [
    /Date\s*de\s*d[ée]but[^<]*<\/[^>]+>\s*<[^>]+>([\d\/\-\.]+)/is,
    /Begindatum[^<]*<\/[^>]+>\s*<[^>]+>([\d\/\-\.]+)/is,
    /Depuis\s*le[^<]*<\/[^>]+>\s*<[^>]+>([\d\/\-\.]+)/is,
  ];
  for (const pat of datePatterns) {
    const m = html.match(pat);
    if (m && m[1]) {
      result.startDate = m[1].trim();
      break;
    }
  }
  
  // ═══ Contact ═══
  const emailMatch = html.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  if (emailMatch) result.email = emailMatch[0];
  const telMatch = html.match(/(?:Tel|Téléphone|Phone)[^<]*<\/[^>]+>\s*<[^>]+>([\d\s\+\-\/\.]+)/i);
  if (telMatch) result.phone = telMatch[1].trim();
  const webMatch = html.match(/(?:Site|Web|URL)[^<]*<\/[^>]+>\s*<[^>]+>(?:<a[^>]*>)?([\w\.\-:\/]+)/i);
  if (webMatch) result.web = webMatch[1].trim();
  
  return result;
}

// ═══ HELPERS ═══

function cleanHtml(str) {
  return (str || '')
    .replace(/<br\s*\/?>/gi, ', ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectForme(raw) {
  const r = raw.toLowerCase();
  if (r.includes('société à responsabilité limitée') || r.includes('besloten vennootschap')) return 'srl';
  if (r.includes('société anonyme') || r.includes('naamloze vennootschap')) return 'sa';
  if (r.includes('association sans but lucratif') || r.includes('vereniging zonder winstoogmerk')) return 'asbl';
  if (r.includes('société coopérative') || r.includes('coöperatieve vennootschap')) return 'sc';
  if (r.includes('société en nom collectif') || r.includes('vennootschap onder firma')) return 'snc';
  if (r.includes('société en commandite') || r.includes('commanditaire vennootschap')) return 'scs';
  if (r.includes('fondation') || r.includes('stichting')) return 'fondation';
  if (r.includes('entreprise individuelle') || r.includes('eenmanszaak')) return 'ei';
  if (r.includes('sprl') || r.includes('bvba')) return 'sprl';
  return 'sprl';
}

function detectFormeFromName(name) {
  if (/\bSA\b/i.test(name)) return 'sa';
  if (/\bSRL\b/i.test(name)) return 'srl';
  if (/\bSPRL\b/i.test(name)) return 'sprl';
  if (/\bASBL\b/i.test(name)) return 'asbl';
  if (/\bSC\b/i.test(name)) return 'sc';
  if (/\bSNC\b/i.test(name)) return 'snc';
  if (/\bSCS\b/i.test(name)) return 'scs';
  if (/\bBV\b/i.test(name)) return 'srl';
  if (/\bNV\b/i.test(name)) return 'sa';
  if (/\bVZW\b/i.test(name)) return 'asbl';
  return 'sprl';
}

// ═══ NACE → Commission Paritaire ═══
function detectCPFromNACE(naceCodes) {
  const results = [];
  const map = {
    // Horeca
    '55': '302', '56': '302',
    // Construction
    '41': '124', '42': '124', '43': '124',
    // Transport routier
    '49.3': '140.03', '49.4': '140.03', '49.41': '140.03',
    // Commerce de détail
    '47': '201',
    // Commerce de gros
    '46': '201',
    // Nettoyage
    '81.2': '121', '81.21': '121', '81.22': '121',
    // Industries alimentaires
    '10': '118', '11': '118',
    // Boulangerie
    '10.71': '118.03',
    // Métal
    '24': '111', '25': '111',
    // Chimie
    '20': '116', '21': '116',
    // Textile
    '13': '120', '14': '120',
    // Bois
    '16': '125',
    // Papier / imprimerie
    '17': '130', '18': '130',
    // Garage
    '45.2': '112',
    // Agriculture
    '01': '144', '02': '144',
    // Banques
    '64': '310',
    // Assurances
    '65': '306',
    // Intérim
    '78': '322',
    // Gardiennage
    '80': '317',
    // Soins de santé
    '86': '330',
    // Enseignement privé
    '85.5': '225',
    // IT & services aux entreprises (DEFAULT)
    '62': '200', '63': '200', '58': '200',
    '69': '200', '70': '200', '71': '200', '72': '200', '73': '200', '74': '200',
    '77': '200', '78': '200', '79': '200', '80': '200', '81': '200', '82': '200',
  };
  
  for (const nace of naceCodes) {
    // Essayer du plus spécifique au plus général
    const attempts = [
      nace,                          // 62.010
      nace.slice(0, 5),              // 62.01
      nace.slice(0, 4),              // 62.0
      nace.slice(0, 2),              // 62
    ];
    for (const attempt of attempts) {
      if (map[attempt]) {
        const cp = map[attempt];
        if (!results.find(r => r.cp === cp)) {
          results.push({ 
            cp, 
            nace, 
            confidence: attempt === nace ? 'exact' : attempt.length >= 4 ? 'high' : 'medium' 
          });
        }
        break;
      }
    }
  }
  
  // Si aucune CP trouvée, default CP 200 (auxiliaire employés)
  if (results.length === 0 && naceCodes.length > 0) {
    results.push({ cp: '200', nace: naceCodes[0], confidence: 'default' });
  }
  
  return results;
}
