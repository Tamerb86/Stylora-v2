# Manual Database Migrations

This directory contains SQL scripts for manual database setup and fixes.

## Scripts Overview

### 1. `stylora_complete_setup.sql`
**Purpose:** Complete initial database setup
- Creates all 54 tables
- Creates initial admin and salon accounts
- Sets up default business hours
- **Run this FIRST** on a fresh database

### 2. `stylora_indexes.sql`
**Purpose:** Add performance indexes
- Creates indexes for all tables
- Improves query performance
- Run after `stylora_complete_setup.sql`

### 3. `add_missing_columns_fixed.sql`
**Purpose:** Add missing columns to existing tables
- Fixes schema mismatches
- Adds columns for: appointments, customers, users, salonSettings
- Run if you get "Unknown column" errors

### 4. `fix_notifications_table.sql`
**Purpose:** Fix notifications table schema
- Adds all required notification columns
- Fixes notification scheduler errors
- Run if notifications are not working

### 5. `fix_platform_admin_access.sql`
**Purpose:** Enable Platform Admin access
- Links admin user to OWNER_OPEN_ID
- Grants full platform management permissions
- Run to access `/saas-admin` panel

### 6. `verify_and_fix_timesheets.sql`
**Purpose:** Fix time clock functionality
- Creates/verifies timesheets table
- Fixes employee clock-in/clock-out
- Run if time clock shows errors

---

## Usage Instructions

### For Fresh Database Setup:
```bash
# 1. Run complete setup
mysql -h <host> -u <user> -p <database> < stylora_complete_setup.sql

# 2. Add indexes
mysql -h <host> -u <user> -p <database> < stylora_indexes.sql

# 3. Fix platform admin access
mysql -h <host> -u <user> -p <database> < fix_platform_admin_access.sql
```

### For Existing Database (Schema Fixes):
```bash
# Fix missing columns
mysql -h <host> -u <user> -p <database> < add_missing_columns_fixed.sql

# Fix notifications
mysql -h <host> -u <user> -p <database> < fix_notifications_table.sql

# Fix timesheets
mysql -h <host> -u <user> -p <database> < verify_and_fix_timesheets.sql
```

---

## Using TablePlus (Recommended)

1. Open TablePlus
2. Connect to your Railway MySQL database
3. Open SQL Query window (Cmd/Ctrl + T)
4. Copy and paste the script content
5. Run (Cmd/Ctrl + Enter)

---

## Important Notes

⚠️ **Always backup your database before running migrations!**

✅ Scripts are idempotent - safe to run multiple times

🔄 Railway will automatically restart the application after database changes

---

## Default Credentials

### Platform Admin:
- Email: `tamerb86@gmail.com`
- Password: `admin12345`
- Access: `/saas-admin/dashboard`

### Salon Owner (Timo Test):
- Email: `tamerb86@outlook.com`
- Password: `admin123456`
- Subdomain: `test.stylora.no`

---

## Troubleshooting

### "Table already exists" errors
✅ Normal - script will skip existing tables

### "Duplicate column name" errors
✅ Normal - column already exists

### "Unknown column" errors
❌ Run the appropriate fix script from above

---

## Environment Variables Required

Make sure these are set in Railway:

```
DATABASE_URL=mysql://...
OWNER_OPEN_ID=platform-owner-tamer
JWT_SECRET=<strong-secret>
NODE_ENV=production
```

---

Last Updated: January 22, 2026
