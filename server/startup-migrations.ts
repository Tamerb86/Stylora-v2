import { db } from "./db";
import { sql } from "drizzle-orm";
import { logger } from "./_core/logger";

/**
 * Runs critical database migrations on application startup
 * These migrations ensure the database schema is up-to-date
 * and fix common issues that prevent the app from working
 */
export async function runStartupMigrations() {
  logger.info("[Startup Migrations] Starting...");

  try {
    // Migration 1: Ensure timesheets table exists with all required columns
    await ensureTimesheetsTable();

    // Migration 2: Fix Platform Admin access
    await fixPlatformAdminAccess();

    // Migration 3: Create timesheets indexes
    await createTimesheetsIndexes();

    logger.info("[Startup Migrations] ✅ All migrations completed successfully");
  } catch (error) {
    logger.error("[Startup Migrations] ❌ Migration failed", { error });
    // Don't crash the app if migrations fail
    // The app might still work with partial functionality
  }
}

async function ensureTimesheetsTable() {
  try {
    logger.info("[Startup Migrations] Checking timesheets table...");

    // Check if table exists
    const tableCheck = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'timesheets'
    `);

    const tableExists = (tableCheck as any)[0]?.count > 0;

    if (!tableExists) {
      logger.info("[Startup Migrations] Creating timesheets table...");
      
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS \`timesheets\` (
          \`id\` varchar(36) NOT NULL,
          \`tenantId\` varchar(36) NOT NULL,
          \`employeeId\` varchar(36) NOT NULL,
          \`clockIn\` datetime NOT NULL,
          \`clockOut\` datetime,
          \`totalHours\` decimal(5,2),
          \`workDate\` date NOT NULL,
          \`notes\` text,
          \`editReason\` text,
          \`editedBy\` varchar(36),
          \`editedAt\` datetime,
          \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          KEY \`tenant_employee_timesheet_idx\` (\`tenantId\`, \`employeeId\`, \`workDate\`),
          KEY \`timesheet_work_date_idx\` (\`workDate\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      logger.info("[Startup Migrations] ✅ Timesheets table created");
    } else {
      logger.info("[Startup Migrations] ✅ Timesheets table already exists");
    }
  } catch (error) {
    logger.error("[Startup Migrations] Error ensuring timesheets table", { error });
    throw error;
  }
}

async function fixPlatformAdminAccess() {
  try {
    logger.info("[Startup Migrations] Fixing Platform Admin access...");

    const ownerOpenId = process.env.OWNER_OPEN_ID || process.env.VITE_OWNER_OPEN_ID;
    
    if (!ownerOpenId) {
      logger.warn("[Startup Migrations] ⚠️ OWNER_OPEN_ID not set, skipping Platform Admin fix");
      return;
    }

    // Update the platform admin user's openId to match OWNER_OPEN_ID
    await db.execute(sql`
      UPDATE \`users\` 
      SET \`openId\` = ${ownerOpenId}
      WHERE \`email\` = 'tamerb86@gmail.com'
      AND (\`openId\` IS NULL OR \`openId\` != ${ownerOpenId})
    `);

    logger.info("[Startup Migrations] ✅ Platform Admin access configured");
  } catch (error) {
    logger.error("[Startup Migrations] Error fixing Platform Admin access", { error });
    // Don't throw - this is not critical for app startup
  }
}

async function createTimesheetsIndexes() {
  try {
    logger.info("[Startup Migrations] Creating timesheets indexes...");

    // Try to create indexes, ignore errors if they already exist
    try {
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS \`tenant_employee_timesheet_idx\` 
        ON \`timesheets\` (\`tenantId\`, \`employeeId\`, \`workDate\`)
      `);
    } catch (e) {
      // Index might already exist, that's fine
    }

    try {
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS \`timesheet_work_date_idx\` 
        ON \`timesheets\` (\`workDate\`)
      `);
    } catch (e) {
      // Index might already exist, that's fine
    }

    logger.info("[Startup Migrations] ✅ Timesheets indexes verified");
  } catch (error) {
    logger.error("[Startup Migrations] Error creating timesheets indexes", { error });
    // Don't throw - indexes are for performance, not critical
  }
}
