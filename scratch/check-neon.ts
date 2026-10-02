import pg from "pg";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(".env.local") });
dotenv.config();

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'comments'");
  console.log("Neon comments columns:", res.rows);
  await pool.end();
}

main().catch(console.error);
