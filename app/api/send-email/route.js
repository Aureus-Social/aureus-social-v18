// Aureus Social Pro — Email Sending API Route
// Uses Resend (or falls back to a log) for sending payslip emails
// Add RESEND_API_KEY to your Vercel env variables

// Basic HTML sanitization: strip dangerous tags/attributes
function sanitizeHTML(html) {
  if (!html) return '';
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?>/gi, '')
    .replace(/<form[\s\S]*?<\/form>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript\s*:/gi, 'blocked:');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { to, subject, html, attachments, from } = body;

    if (!to || !subject) {
      return Response.json({ error: 'Missing to or subject' }, { status: 400 });
    }

    // Validate email addresses
    const recipients = Array.isArray(to) ? to : [to];
    for (const addr of recipients) {
      if (!isValidEmail(addr)) {
        return Response.json({ error: 'Invalid email address: ' + addr.slice(0, 50) }, { status: 400 });
      }
    }

    // Validate subject length
    if (subject.length > 500) {
      return Response.json({ error: 'Subject too long (max 500 chars)' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      // No Resend key — log and return success (dev mode)
      console.log('[EMAIL-DEV]', { to, subject, htmlLength: html?.length || 0 });
      return Response.json({
        success: true,
        mode: 'dev',
        message: 'Email logged (no RESEND_API_KEY configured)',
        to,
        subject,
      });
    }

    // Build Resend payload with sanitized HTML
    const payload = {
      from: from || 'Aureus Social Pro <noreply@aureussocial.be>',
      to: recipients,
      subject: subject.slice(0, 500),
      html: sanitizeHTML(html) || '<p>Voir pièce jointe</p>',
    };

    // Add attachments if provided (base64 encoded)
    if (attachments && attachments.length > 0) {
      payload.attachments = attachments.map(att => ({
        filename: att.filename || 'document.html',
        content: att.content, // base64 string
        content_type: att.contentType || 'text/html',
      }));
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[EMAIL-ERROR]', data);
      return Response.json({ error: data.message || 'Resend error', details: data }, { status: res.status });
    }

    return Response.json({
      success: true,
      mode: 'resend',
      id: data.id,
      to: payload.to,
      subject,
    });

  } catch (error) {
    console.error('[EMAIL-CRASH]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Health check
export async function GET() {
  const hasKey = !!process.env.RESEND_API_KEY;
  return Response.json({
    service: 'Aureus Social Pro — Email API',
    status: 'ok',
    resend: hasKey ? 'configured' : 'not configured (dev mode)',
    timestamp: new Date().toISOString(),
  });
}
