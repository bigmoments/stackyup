import pg from "pg";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function check() {
  const url = process.env.DATABASE_URL;
  console.log("Checking DB URL:", url ? url.slice(0, 35) + "..." : "undefined");

  const client = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("Connected to PostgreSQL successfully.");

  const res = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
  );
  console.log("Tables in public schema:", res.rows.map((r) => r.table_name));

  await client.end();
}

check().catch((err) => {
  console.error("Check DB failed:", err);
  process.exit(1);
});
