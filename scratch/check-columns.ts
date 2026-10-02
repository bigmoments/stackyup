import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(".env.local") });
dotenv.config();

import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function main() {
  const res = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'comments'`);
  console.log("Comments columns in current db:", res);
}

main().catch(console.error);
