# CampusTrack — Backup & Recovery Strategy

## Overview

| Item | Value |
|------|-------|
| Database | PostgreSQL |
| Target RPO | 24 hours (daily backups) |
| Target RTO | < 1 hour |
| Retention | 7 days (dev) / 30 days (prod) |

---

## 1. Backup Commands

### Local Development

```bash
# Full backup (run daily)
pg_dump -h localhost -U postgres -d college_attendance -F c -f backup_$(date +%Y%m%d).dump

# Backup with timestamp
pg_dump -h localhost -U postgres -d college_attendance -F c -f backups/campustrack_$(date +%Y%m%d_%H%M%S).dump
```

### Production (Railway/Render/Supabase)

```bash
# Railway
pg_dump "$DATABASE_URL" -F c -f backup_prod_$(date +%Y%m%d).dump

# Render
pg_dump "postgresql://user:pass@host:port/dbname?sslmode=require" -F c -f backup_prod_$(date +%Y%m%d).dump

# Supabase
pg_dump "postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres" -F c -f backup_prod_$(date +%Y%m%d).dump
```

### Backup Flags Reference

| Flag | Purpose |
|------|---------|
| `-F c` | Custom format (compressed, restorable) |
| `-F p` | Plain SQL (readable, larger) |
| `-F t` | Tar archive |
| `--clean` | Include DROP statements |
| `--if-exists` | Safe drops |

---

## 2. Restore Commands

### Standard Restore

```bash
# Restore to existing database (DESTRUCTIVE)
pg_restore -h localhost -U postgres -d college_attendance -c --if-exists backup_20260102.dump

# Restore to NEW database (SAFE)
createdb -h localhost -U postgres college_attendance_restored
pg_restore -h localhost -U postgres -d college_attendance_restored backup_20260102.dump
```

### Restore Specific Tables

```bash
# Restore only attendance data
pg_restore -h localhost -U postgres -d college_attendance -t AttendanceRecord backup_20260102.dump

# Restore users and related
pg_restore -h localhost -U postgres -d college_attendance -t User -t StudentProfile -t FacultyProfile backup_20260102.dump
```

### Production Restore

```bash
# ALWAYS restore to a staging DB first
pg_restore "$DATABASE_URL_STAGING" -c --if-exists backup_prod_20260102.dump

# After verification, restore to production
pg_restore "$DATABASE_URL" -c --if-exists backup_prod_20260102.dump
```

---

## 3. Retention Policy

| Environment | Frequency | Keep | Storage |
|-------------|-----------|------|---------|
| Development | Weekly | 7 days | Local `./backups/` |
| Staging | Daily | 14 days | Cloud (S3/GCS) |
| Production | Daily | 30 days | Cloud (encrypted) |

### Cleanup Script

```bash
# Delete backups older than 7 days (local)
find ./backups -name "*.dump" -mtime +7 -delete

# Delete backups older than 30 days (production)
find ./backups -name "backup_prod_*.dump" -mtime +30 -delete
```

---

## 4. Backup Validation

### Verify Backup File

```bash
# Check backup integrity
pg_restore --list backup_20260102.dump

# Verify size is reasonable
ls -lh backup_20260102.dump
```

### Test Restore (Monthly)

```bash
# 1. Create test database
createdb -h localhost -U postgres campustrack_test_restore

# 2. Restore backup
pg_restore -h localhost -U postgres -d campustrack_test_restore backup_20260102.dump

# 3. Verify data
psql -h localhost -U postgres -d campustrack_test_restore -c "SELECT COUNT(*) FROM \"User\";"

# 4. Cleanup
dropdb -h localhost -U postgres campustrack_test_restore
```

### Validation Checklist

- [ ] Backup file exists and > 0 bytes
- [ ] `pg_restore --list` succeeds
- [ ] Test restore completes without errors
- [ ] Row counts match production
- [ ] Application connects successfully

---

## 5. Disaster Recovery Scenarios

### Scenario A: Accidental User Deletion

```bash
# 1. Don't panic - soft delete should be used
# 2. Check if user is soft-deleted
psql -c "SELECT * FROM \"User\" WHERE email = 'user@example.com';"

# 3. If hard-deleted, restore from backup to staging
pg_restore -d campustrack_staging -t User backup_latest.dump

# 4. Extract specific user
psql -d campustrack_staging -c "COPY (SELECT * FROM \"User\" WHERE email = 'user@example.com') TO '/tmp/user_restore.csv' CSV;"

# 5. Import to production
psql -d college_attendance -c "COPY \"User\" FROM '/tmp/user_restore.csv' CSV;"
```

### Scenario B: Attendance Data Corruption

```bash
# 1. Identify corruption timeframe
psql -c "SELECT MIN(createdAt), MAX(createdAt) FROM \"AttendanceRecord\" WHERE status IS NULL;"

# 2. Restore attendance table only
pg_restore -d college_attendance -t AttendanceRecord -c --if-exists backup_before_corruption.dump
```

### Scenario C: Failed Migration

```bash
# 1. Take pre-migration backup
pg_dump "$DATABASE_URL" -F c -f backup_pre_migration_$(date +%Y%m%d_%H%M%S).dump

# 2. Run migration
npx prisma migrate deploy

# 3. If failure, restore
pg_restore "$DATABASE_URL" -c --if-exists backup_pre_migration_*.dump

# 4. Reset Prisma migration state
npx prisma migrate resolve --rolled-back "migration_name"
```

### Scenario D: Deployment Rollback

```bash
# 1. Application rollback (Git)
git revert HEAD
git push origin main

# 2. Database stays intact (no schema change)
# OR if schema changed:
pg_restore "$DATABASE_URL" -c --if-exists backup_pre_deploy.dump
```

---

## 6. Security & Access

### Backup File Protection

```bash
# Set restrictive permissions
chmod 600 *.dump

# Encrypt backup (GPG)
gpg --symmetric --cipher-algo AES256 backup_prod_20260102.dump

# Decrypt when needed
gpg --decrypt backup_prod_20260102.dump.gpg > backup_prod_20260102.dump
```

### Cloud Storage (S3)

```bash
# Upload with encryption
aws s3 cp backup_prod_$(date +%Y%m%d).dump s3://campustrack-backups/ --sse AES256

# Download for restore
aws s3 cp s3://campustrack-backups/backup_prod_20260102.dump ./
```

### Access Control

| Role | Backup | Restore | Delete |
|------|--------|---------|--------|
| Admin/DevOps | ✅ | ✅ | ✅ |
| Developer | ✅ (staging) | ❌ | ❌ |
| DBA | ✅ | ✅ | ❌ |

---

## 7. Automated Backup (External)

### Cron Job (Server)

```cron
# Daily backup at 2 AM
0 2 * * * pg_dump "$DATABASE_URL" -F c -f /backups/campustrack_$(date +\%Y\%m\%d).dump

# Weekly cleanup
0 3 * * 0 find /backups -name "*.dump" -mtime +30 -delete
```

### Managed Services

| Provider | Auto-Backup | Retention | Notes |
|----------|-------------|-----------|-------|
| Railway | ✅ Daily | 7 days | Automatic |
| Render | ✅ Daily | 7 days | Pro plan |
| Supabase | ✅ Daily | 7/30 days | Plan-based |
| Neon | ✅ PITR | 7-30 days | Point-in-time |

---

## 8. Quick Reference

### Pre-Deployment Checklist

- [ ] Take full backup
- [ ] Verify backup file
- [ ] Note current row counts
- [ ] Test restore on staging
- [ ] Proceed with deployment

### Post-Incident Checklist

- [ ] Assess damage scope
- [ ] Identify last good backup
- [ ] Restore to staging first
- [ ] Verify restored data
- [ ] Schedule production restore window
- [ ] Notify affected users
- [ ] Document incident

### Emergency Contacts

| Role | Action |
|------|--------|
| On-call DevOps | Initiate restore |
| Database Admin | Verify integrity |
| Team Lead | Approve production changes |

---

## Confirmation

| Check | Status |
|-------|--------|
| No code modified | ✅ |
| No schema changed | ✅ |
| No runtime dependencies | ✅ |
| No behavior changes | ✅ |
| Documentation only | ✅ |

---

## PHASE P5 STATUS

### ✅ LOCKED - PHASE P5 COMPLETE

Backup & Recovery strategy documented.
Zero runtime impact.
Ready for operational use.

**Signed off:** January 2, 2026
