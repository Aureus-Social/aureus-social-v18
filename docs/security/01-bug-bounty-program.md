# Aureus IA SPRL — Vulnerability Disclosure Policy
## Bug Bounty Program

**Effective Date:** February 27, 2026  
**Contact:** security@aureusia.com  
**PGP Key:** [To be published]

---

## Scope

### In Scope

| Target | Type | Severity |
|--------|------|----------|
| `app.aureussocial.be` | Web application | All |
| `aureussocial.be` | Marketing site | Medium+ |
| `api.aureussocial.be/api/v1/*` | REST API | All |
| Authentication/Authorization | Logic | All |
| Data isolation (multi-tenant) | Business logic | Critical |

### Out of Scope

- Physical attacks
- Social engineering (phishing employees)
- Denial of Service (DoS/DDoS)
- Spam or rate limiting abuse
- Self-XSS (no user impact)
- Clickjacking on non-sensitive pages
- Missing security headers on non-sensitive pages
- Software version disclosure
- Reports from automated tools without proof of exploitability

---

## Severity & Rewards

| Severity | CVSS | Examples | Reward |
|----------|------|---------|--------|
| **Critical** | 9.0-10.0 | RCE, SQL injection, authentication bypass, tenant data leak (accessing other tenant's NISS/salary data) | €500 — €2,000 |
| **High** | 7.0-8.9 | Privilege escalation, IDOR on sensitive data, SSRF to internal services | €200 — €500 |
| **Medium** | 4.0-6.9 | Stored XSS, CSRF on sensitive actions, information disclosure (non-PII) | €50 — €200 |
| **Low** | 0.1-3.9 | Reflected XSS (limited impact), open redirect, misconfiguration | Hall of Fame |

### Bonus multipliers
- First report of a new vulnerability class: **×1.5**
- Exceptional write-up with remediation advice: **×1.25**
- Report affecting Belgian payroll calculation accuracy: **×2.0**

---

## Rules of Engagement

### Do's ✅
- Test only against your own account(s) — we will provide test credentials on request
- Minimize impact — stop testing if you accidentally access other users' data
- Report vulnerabilities promptly via security@aureusia.com
- Provide detailed reproduction steps, screenshots, and proof of concept
- Allow reasonable time for remediation before public disclosure (90 days)
- Use your real identity for reward eligibility

### Don'ts ❌
- Do not access, modify, or delete data belonging to other users
- Do not perform destructive testing (data deletion, corruption)
- Do not test against production during Belgian payroll deadlines (15th, 25th of month)
- Do not use automated scanners without prior approval
- Do not disclose vulnerabilities publicly before remediation
- Do not attempt to decrypt or access encrypted data at rest
- Do not attempt to access Belgian National Register (NISS) data of real individuals

---

## Reporting

### How to report

**Email:** security@aureusia.com  
**Subject:** `[BUG-BOUNTY] [Severity] Brief description`

### Report template

```
## Vulnerability Report

**Reporter:** [Your name / handle]
**Date:** [Date]
**Severity:** [Critical / High / Medium / Low]
**CVSS Score:** [If known]

### Summary
[One paragraph describing the vulnerability]

### Affected Component
- URL/Endpoint: 
- Parameter:
- Module:

### Steps to Reproduce
1. 
2. 
3. 

### Impact
[What can an attacker do? What data is at risk?]

### Proof of Concept
[Screenshots, HTTP requests/responses, video]

### Suggested Remediation
[Optional but appreciated]
```

### Response timeline

| Action | SLA |
|--------|-----|
| Acknowledgment | 24 hours |
| Triage & severity assessment | 72 hours |
| Status update | 7 days |
| Remediation (Critical) | 7 days |
| Remediation (High) | 14 days |
| Remediation (Medium) | 30 days |
| Remediation (Low) | 90 days |
| Reward payment | 14 days after fix verified |

---

## Legal Safe Harbor

Aureus IA SPRL will not pursue legal action against security researchers who:

- Act in good faith and follow this policy
- Avoid violating the privacy of others
- Do not exploit vulnerabilities beyond what is necessary to demonstrate them
- Report vulnerabilities through the designated channel
- Do not engage in extortion or threats

This safe harbor applies to Belgian law (including the Computer Crime Act — Loi du 28/11/2000) as well as applicable EU regulations. We consider security research conducted consistent with this policy to be authorized conduct.

---

## Hall of Fame

| Researcher | Vulnerability | Severity | Date |
|-----------|--------------|----------|------|
| *Be the first!* | — | — | — |

---

## security.txt (RFC 9116)

The following content should be placed at `/.well-known/security.txt`:

```
Contact: mailto:security@aureusia.com
Expires: 2027-02-27T23:59:59.000Z
Encryption: https://aureussocial.be/.well-known/pgp-key.txt
Acknowledgments: https://aureussocial.be/security/hall-of-fame
Preferred-Languages: fr, nl, en
Canonical: https://aureussocial.be/.well-known/security.txt
Policy: https://aureussocial.be/security/disclosure-policy
Hiring: https://aureusia.com/careers
```
