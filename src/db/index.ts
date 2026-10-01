import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import path from "path";
import fs from "fs";
import * as schema from "./schema";

const { Pool } = pg;

type DbClient = ReturnType<typeof drizzlePg<typeof schema>> | ReturnType<typeof drizzlePglite<typeof schema>>;

let cachedDb: DbClient | null = null;

export function getDb(): DbClient {
  if (cachedDb) return cachedDb;

  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl && dbUrl.trim() !== "") {
    // Connect to external PostgreSQL (Neon, Supabase, RDS, local PG)
    const pool = new Pool({
      connectionString: dbUrl,
      ssl: dbUrl.includes("sslmode=require") || dbUrl.includes("neon.tech") || dbUrl.includes("supabase.co")
        ? { rejectUnauthorized: false }
        : undefined,
    });
    cachedDb = drizzlePg(pool, { schema });
    return cachedDb;
  }

  // Fallback: embedded local PGlite (stored in ./.data/pglite)
  const dataDir = path.resolve(process.cwd(), ".data", "pglite");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const pglite = new PGlite(dataDir);
  cachedDb = drizzlePglite(pglite, { schema });
  return cachedDb;
}

export const db = getDb();
export { schema };
