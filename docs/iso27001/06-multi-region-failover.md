# Multi-Region Failover — Architecture
## Aureus Social Pro — Haute Disponibilité

**Version :** 1.0 | **Date :** 27/02/2026

---

## Architecture cible

```
                    ┌─────────────┐
                    │ Cloudflare  │
                    │    DNS      │
                    │ Health Check│
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼                         ▼
    ┌──────────────────┐    ┌──────────────────┐
    │  Vercel (Primary) │    │  Railway (Backup) │
    │  Edge Network     │    │  eu-west          │
    │  fra1/cdg1        │    │  Docker container  │
    └────────┬─────────┘    └────────┬─────────┘
             │                       │
    ┌────────┼───────────────────────┼────────┐
    │        ▼                       ▼        │
    │  ┌───────────────┐   ┌───────────────┐  │
    │  │ Supabase      │   │ Supabase      │  │
    │  │ PRIMARY       │◄──│ READ REPLICA  │  │
    │  │ eu-west-1     │   │ eu-central-1  │  │
    │  │ (AWS Ireland) │   │ (AWS Frankfurt)│  │
    │  └───────────────┘   └───────────────┘  │
    │        PostgreSQL Logical Replication     │
    └──────────────────────────────────────────┘
```

## Configuration Cloudflare Health Checks

```json
{
  "health_check": {
    "primary": {
      "url": "https://app.aureussocial.be/api/health?deep=true",
      "interval": 60,
      "timeout": 10,
      "retries": 3,
      "expected_codes": "200",
      "follow_redirects": true,
      "header": { "User-Agent": "Cloudflare-Health-Check" }
    },
    "failover_trigger": {
      "consecutive_failures": 3,
      "action": "switch_to_backup"
    }
  },
  "dns_failover": {
    "primary": {
      "type": "CNAME",
      "value": "cname.vercel-dns.com",
      "priority": 1,
      "health_check": true
    },
    "backup": {
      "type": "CNAME", 
      "value": "aureus-backup.up.railway.app",
      "priority": 2,
      "health_check": true
    }
  }
}
```

## Supabase Read Replica Configuration

### Activation (Supabase Pro plan requis)

```sql
-- Sur le projet PRIMARY (eu-west-1)
-- Via Supabase Dashboard > Settings > Read Replicas > Add Replica
-- Region: eu-central-1 (Frankfurt)

-- Vérification replication
SELECT * FROM pg_stat_replication;

-- Vérification lag
SELECT 
  NOW() - pg_last_xact_replay_timestamp() AS replication_lag;
```

### Connection strings

```env
# Primary (read-write)
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Read Replica (read-only, for analytics & reports)
DATABASE_URL_REPLICA=postgresql://postgres:[password]@db.[project-ref-replica].supabase.co:5432/postgres
```

### Application-level read/write splitting

```javascript
// lib/supabase-ha.js
import { createClient } from '@supabase/supabase-js';

const primary = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const replica = process.env.SUPABASE_REPLICA_URL 
  ? createClient(process.env.SUPABASE_REPLICA_URL, process.env.SUPABASE_REPLICA_KEY)
  : primary; // Fallback to primary if no replica

// Read operations → replica (analytics, reports, listings)
export function getReadClient() { return replica; }

// Write operations → primary (mutations, inserts, updates)
export function getWriteClient() { return primary; }

// Smart routing
export function getClient(operation = 'read') {
  return operation === 'write' ? primary : replica;
}
```

## Monitoring & Alerting

| Metric | Threshold | Alert |
|--------|-----------|-------|
| Health check failure | 3 consecutive | PagerDuty / email |
| DB latency | > 2000ms | Slack #ops |
| Replication lag | > 30 seconds | PagerDuty |
| Error rate | > 5% over 5 min | Email + Slack |
| CPU/Memory | > 85% | Slack #ops |

## Failover Procedure

### Automatic (Cloudflare)
1. Health check detects 3 consecutive failures on primary
2. DNS automatically switches to backup Railway endpoint
3. Alert sent to team
4. Backup serves app from cached data + read replica

### Manual
1. SSH into Railway dashboard
2. Verify backup app is running and healthy
3. Switch Cloudflare DNS manually if automatic failover didn't trigger
4. Monitor replication lag
5. Once primary recovered, switch back + verify data sync

## Estimated Cost

| Service | Monthly Cost |
|---------|-------------|
| Supabase Pro (with read replica) | $25 + $25 = $50 |
| Railway backup (standby) | ~$5 (minimal usage) |
| Cloudflare Pro (health checks) | $20 |
| **Total** | **~$75/month** |

---
*Objectif : RTO < 1 heure, RPO < 5 minutes*
