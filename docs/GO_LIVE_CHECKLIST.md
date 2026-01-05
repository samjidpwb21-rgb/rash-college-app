# CampusTrack — Go-Live Checklist & Rollback Plan

## 1. Pre-Deployment Checklist

### Environment Variables

| Variable | Required | Verify |
|----------|----------|--------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | Random 32+ char string |
| `NEXTAUTH_URL` | ✅ | Production URL (https://...) |
| `NODE_ENV` | ✅ | Set to `production` |

```bash
# Verify all vars are set (no empty values)
printenv | grep -E "DATABASE_URL|NEXTAUTH"
```

### Database

- [ ] Database is reachable from deployment environment
- [ ] Database user has correct permissions
- [ ] SSL/TLS enabled for production
- [ ] Connection pool configured (if applicable)

```bash
# Test connection
psql "$DATABASE_URL" -c "SELECT 1;"
```

### Build Prerequisites

- [ ] Node.js version matches `.nvmrc` or `engines` in package.json
- [ ] `npm install` completes without errors
- [ ] `npx prisma generate` runs successfully
- [ ] `npm run build` passes with exit code 0

```bash
node --version        # Should be 18.x or 20.x
npm run build         # Must exit 0
```

### Git Verification

- [ ] Deploying from correct branch (`main` / `production`)
- [ ] No uncommitted changes
- [ ] Tag created for release (e.g., `v1.0.0`)

```bash
git status            # Should be clean
git log -1 --oneline  # Verify commit
git tag -l            # List tags
```

### Pre-Deploy Backup

- [ ] Database backup taken (see P5)
- [ ] Backup file verified

```bash
pg_dump "$DATABASE_URL" -F c -f backup_pre_deploy_$(date +%Y%m%d_%H%M%S).dump
```

---

## 2. Deployment Steps

### Step 1: Final Build

```bash
npm install
npx prisma generate
npm run build
```

### Step 2: Database Migration (if any)

```bash
# Take backup first!
npx prisma migrate deploy
```

### Step 3: Deploy Application

**Vercel:**
```bash
vercel --prod
```

**Railway:**
```bash
railway up --detach
```

**Render:**
- Push to connected Git branch
- Or trigger manual deploy from dashboard

**Generic (Docker/VPS):**
```bash
docker build -t campustrack:latest .
docker run -d -p 3000:3000 --env-file .env.production campustrack:latest
```

### Step 4: Verify Deployment

```bash
# Health check
curl -I https://your-domain.com

# Should return 200 OK
```

### Step 5: Admin Login Test

1. Navigate to `/login`
2. Login with admin credentials
3. Verify dashboard loads
4. Check for console errors

---

## 3. Post-Deployment Smoke Tests

### Critical Path Tests (Do ALL)

| # | Test | Expected | Pass |
|---|------|----------|------|
| 1 | Home page loads | 200 OK, no errors | ☐ |
| 2 | Login page renders | Form visible | ☐ |
| 3 | Admin login | Dashboard loads | ☐ |
| 4 | Faculty login | Dashboard loads | ☐ |
| 5 | Student login | Dashboard loads | ☐ |
| 6 | Student attendance view | Calendar renders | ☐ |
| 7 | Faculty mark attendance | Modal opens/saves | ☐ |
| 8 | Create notice (admin) | Toast success | ☐ |
| 9 | Notifications load | Bell count visible | ☐ |
| 10 | No console errors | DevTools clean | ☐ |

### Quick API Checks

```bash
# Auth endpoint
curl -I https://your-domain.com/api/auth/providers

# Should return 200
```

### Time Limit

- Complete smoke tests within **15 minutes** of deploy
- If ANY critical test fails → consider rollback

---

## 4. Rollback Plan

### Decision Matrix

| Scenario | Rollback App? | Rollback DB? |
|----------|---------------|--------------|
| UI bug (non-critical) | ❌ No | ❌ No |
| UI bug (blocking) | ✅ Yes | ❌ No |
| Auth failures | ✅ Yes | ❌ No |
| Data not loading | ✅ Yes | ❌ No |
| Data corruption | ✅ Yes | ✅ Yes |
| Failed migration | ✅ Yes | ✅ Yes |
| Performance issue | ⚠️ Maybe | ❌ No |

### App Rollback (No DB Change)

**Vercel:**
```bash
# Revert to previous deployment
vercel rollback
```

**Railway:**
```bash
# Redeploy previous commit
railway up --commit <previous-sha>
```

**Git-based (Render/Generic):**
```bash
git revert HEAD
git push origin main
# Platform auto-deploys
```

### App + Database Rollback

1. **Stop traffic** (maintenance mode if available)
2. **Rollback app** to previous version
3. **Restore database** from pre-deploy backup

```bash
# Restore from backup
pg_restore "$DATABASE_URL" -c --if-exists backup_pre_deploy_*.dump

# Verify
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"User\";"
```

4. **Reset migration state** (if migration failed)

```bash
npx prisma migrate resolve --rolled-back "failed_migration_name"
```

5. **Verify app connects** to restored database
6. **Resume traffic**

### Rollback Time Targets

| Action | Target Time |
|--------|-------------|
| Detect issue | < 5 min |
| Decide rollback | < 5 min |
| Execute rollback | < 10 min |
| Verify recovery | < 10 min |
| **Total RTO** | **< 30 min** |

---

## 5. Failure Scenarios

### Scenario A: App Crashes After Deploy

**Symptoms:** 500 errors, blank pages, server not responding

**Actions:**
1. Check platform logs (Vercel/Railway/Render dashboard)
2. Look for startup errors
3. Verify env vars are set
4. Rollback app to previous version
5. Investigate in staging

### Scenario B: Auth Failures

**Symptoms:** Cannot login, session errors, redirect loops

**Actions:**
1. Verify `NEXTAUTH_SECRET` is set (same as before)
2. Verify `NEXTAUTH_URL` matches actual URL
3. Check database connectivity
4. Clear cookies and retry
5. If persists → rollback app

### Scenario C: Database Connection Loss

**Symptoms:** "Cannot connect to database" errors

**Actions:**
1. Verify `DATABASE_URL` is correct
2. Check database is running (provider dashboard)
3. Verify IP allowlist (if applicable)
4. Check SSL requirements
5. Contact database provider if needed

### Scenario D: Broken UI Route

**Symptoms:** Specific page crashes, others work

**Actions:**
1. Check browser console for errors
2. Identify error in observability logs
3. If critical path → rollback app
4. If non-critical → hotfix forward

### Scenario E: Performance Degradation

**Symptoms:** Slow responses, timeouts, high latency

**Actions:**
1. Check platform metrics (CPU, memory)
2. Review recent code changes
3. Check database query performance
4. Scale up resources if needed
5. If severe → consider rollback

---

## 6. Access & Responsibility

### Deployment Authority

| Role | Can Deploy | Can Rollback | Emergency |
|------|------------|--------------|-----------|
| DevOps Lead | ✅ | ✅ | ✅ |
| Senior Dev | ✅ | ✅ (with approval) | ✅ |
| Developer | ❌ | ❌ | ❌ |

### Log Locations

| Platform | Logs URL |
|----------|----------|
| Vercel | Dashboard → Deployments → Logs |
| Railway | Dashboard → Service → Logs |
| Render | Dashboard → Service → Logs |
| Custom | `/var/log/campustrack/` or stdout |

### Emergency Checklist

1. **Assess severity** (critical/high/medium/low)
2. **Notify team lead** if critical
3. **Attempt quick fix** if obvious (< 5 min)
4. **Rollback** if fix not possible
5. **Document incident** after resolution
6. **Post-mortem** within 24 hours for critical issues

---

## Quick Reference Card

### Deploy

```bash
npm run build && npx prisma migrate deploy && [platform deploy command]
```

### Rollback App

```bash
vercel rollback   # or
git revert HEAD && git push
```

### Rollback DB

```bash
pg_restore "$DATABASE_URL" -c --if-exists backup_pre_deploy_*.dump
```

### Emergency Logs

```bash
# Vercel
vercel logs --follow

# Railway
railway logs --follow

# Generic
tail -f /var/log/campustrack/app.log
```

---

## Confirmation

| Check | Status |
|-------|--------|
| No code modified | ✅ |
| No schema changed | ✅ |
| No dependencies added | ✅ |
| Documentation only | ✅ |

---

## PHASE P7 STATUS

### ✅ LOCKED - PHASE P7 COMPLETE

Go-live checklist and rollback plan documented.
Zero runtime impact.
Ready for production deployment.

**Signed off:** January 2, 2026
