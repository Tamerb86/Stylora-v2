import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { plans } from './schema.js';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  console.log('🌱 Starting database seeding...');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  try {
    // Seed default plans
    const defaultPlans = [
      {
        id: uuidv4(),
        code: 'free' as const,
        name: 'Free',
        stripePriceId: null,
        monthlyLimitRequests: 10, // 10 requests per month
      },
      {
        id: uuidv4(),
        code: 'pro' as const,
        name: 'Pro',
        stripePriceId: null, // Will be set after Stripe setup
        monthlyLimitRequests: 100, // 100 requests per month
      },
      {
        id: uuidv4(),
        code: 'business' as const,
        name: 'Business',
        stripePriceId: null, // Will be set after Stripe setup
        monthlyLimitRequests: -1, // Unlimited (-1 means unlimited)
      },
    ];

    console.log('📦 Inserting default plans...');
    
    // Insert plans one by one to handle potential duplicates
    for (const plan of defaultPlans) {
      try {
        await db.insert(plans).values(plan);
        console.log(`  ✅ Plan "${plan.name}" inserted`);
      } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`  ⚠️ Plan "${plan.name}" already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }

    console.log('✅ Default plans seeding completed!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }

  console.log('✅ Database seeding completed!');
  process.exit(0);
}

seed();
