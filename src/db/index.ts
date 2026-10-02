import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import path from "path";
import fs from "fs";
import * as schema from "./schema";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const { Pool } = pg;

type DbClient = ReturnType<typeof drizzlePg<typeof schema>> | ReturnType<typeof drizzlePglite<typeof schema>>;

declare global {
  // eslint-disable-next-line no-var
  var __cachedDb: DbClient | undefined;
  // eslint-disable-next-line no-var
  var __cachedPool: pg.Pool | undefined;
}

export function getDb(): DbClient {
  if (globalThis.__cachedDb) return globalThis.__cachedDb;

  dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
  dotenv.config();

  const useLocal =
    process.env.USE_LOCAL_DB === "true" ||
    process.env.USE_LOCAL_DB === "1" ||
    !process.env.DATABASE_URL ||
    process.env.DATABASE_URL.trim() === "";

  if (!useLocal && process.env.DATABASE_URL) {
    const dbUrl = process.env.DATABASE_URL;
    // Optimized connection pooling for Vercel Serverless & Neon
    if (!globalThis.__cachedPool) {
      globalThis.__cachedPool = new Pool({
        connectionString: dbUrl,
        max: 10, // Adequate pool for Next.js multi-worker build and serverless environment
        idleTimeoutMillis: 15000, // 15s idle drops connection cleanly
        connectionTimeoutMillis: 10000, // 10s allows Neon cold-start wake up without timing out indefinitely
        ssl: dbUrl.includes("sslmode=require") || dbUrl.includes("neon.tech") || dbUrl.includes("supabase.co")
          ? { rejectUnauthorized: false }
          : undefined,
      });
    }

    const client = drizzlePg(globalThis.__cachedPool, { schema });
    globalThis.__cachedDb = client;
    return client;
  }

  // Fallback: embedded local PGlite (stored in ./.data/pglite)
  const dataDir = path.resolve(process.cwd(), ".data", "pglite");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const pglite = new PGlite(dataDir);
  const client = drizzlePglite(pglite, { schema });
  globalThis.__cachedDb = client;
  return client;
}

export const db = getDb();
export { schema };
