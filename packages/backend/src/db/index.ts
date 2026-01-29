import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema.js';

// Create MySQL connection pool
const poolConnection = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Create Drizzle instance with schema
export const db = drizzle(poolConnection, { schema, mode: 'default' });

// Export pool for direct queries if needed
export { poolConnection };

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await poolConnection.getConnection();
    console.log('✅ Database connection successful');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
