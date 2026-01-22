import { getDb } from "./db";
import { ENV } from "./_core/env";
import { sql } from "drizzle-orm";

/**
 * Run critical database migrations on application startup
 * These migrations fix schema issues and ensure platform admin access
 */
export async function runStartupMigrations() {
  console.log("[Startup Migrations] Starting...");
  
  const db = await getDb();
  if (!db) {
    console.error("[Startup Migrations] Database not available, skipping migrations");
    return;
  }

  try {
    // ============================================================================
    // MIGRATION 1: Ensure timesheets table exists
    // ============================================================================
    console.log("[Startup Migrations] Checking timesheets table...");
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS \`timesheets\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`tenantId\` varchar(36) NOT NULL,
        \`employeeId\` int NOT NULL,
        \`clockIn\` timestamp NOT NULL,
        \`clockOut\` timestamp,
        \`totalHours\` decimal(5,2),
        \`workDate\` date NOT NULL,
        \`notes\` text,
        \`editReason\` text,
        \`editedBy\` int,
        \`editedAt\` timestamp,
        \`createdAt\` timestamp NOT NULL DEFAULT (now()),
        \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`timesheets_id\` PRIMARY KEY(\`id\`)
      )
    `);
    
    console.log("[Startup Migrations] ✅ Timesheets table verified");

    // ============================================================================
    // MIGRATION 2: Fix Platform Admin access
    // ============================================================================
    console.log("[Startup Migrations] Fixing Platform Admin access...");
    
    const ownerOpenId = ENV.ownerOpenId || "platform-owner-tamer";
    const adminEmail = "tamerb86@gmail.com";
    
    // Update admin user's openId to match OWNER_OPEN_ID
    await db.execute(sql`
      UPDATE \`users\` 
      SET \`openId\` = ${ownerOpenId}
      WHERE \`email\` = ${adminEmail}
      AND \`openId\` != ${ownerOpenId}
    `);
    
    console.log("[Startup Migrations] ✅ Platform Admin access configured");

    // ============================================================================
    // MIGRATION 3: Ensure timesheets indexes exist
    // ============================================================================
    console.log("[Startup Migrations] Creating timesheets indexes...");
    
    try {
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS \`tenant_employee_timesheet_idx\` 
        ON \`timesheets\` (\`tenantId\`, \`employeeId\`, \`workDate\`)
      `);
    } catch (e: any) {
      // Index might already exist, ignore error
      if (!e.message?.includes("Duplicate key name")) {
        console.warn("[Startup Migrations] Index creation warning:", e.message);
      }
    }
    
    try {
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS \`timesheet_work_date_idx\` 
        ON \`timesheets\` (\`workDate\`)
      `);
    } catch (e: any) {
      // Index might already exist, ignore error
      if (!e.message?.includes("Duplicate key name")) {
        console.warn("[Startup Migrations] Index creation warning:", e.message);
      }
    }
    
    console.log("[Startup Migrations] ✅ Timesheets indexes verified");

    // ============================================================================
    // SUCCESS
    // ============================================================================
    console.log("[Startup Migrations] ✅ All migrations completed successfully");
    
  } catch (error) {
    console.error("[Startup Migrations] ❌ Error running migrations:", error);
    // Don't throw - let the application start even if migrations fail
    // This prevents the app from crashing on startup
  }
}
