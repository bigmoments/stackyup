import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, schema } from "./index";
import { runMigrations } from "./migrate";
import { generateApiKey } from "@/lib/auth";

export async function seed() {
  console.log("Ensuring database migrations are up to date...");
  await runMigrations();

  console.log("Seeding initial data...");

  // 1. Check or create default Muse API Key
  const existingKeys = await db.select().from(schema.apiKeys).limit(1);
  let activeKey = "";

  if (existingKeys.length === 0) {
    const { key, keyHash, keyPrefix } = generateApiKey();
    activeKey = key;
    const keyId = `k_${nanoid(16)}`;

    await db.insert(schema.apiKeys).values({
      id: keyId,
      name: "Default Muse Production Key",
      keyHash,
      keyPrefix,
      isActive: true,
    });

    console.log("--------------------------------------------------");
    console.log("GENERATED NEW MUSE API KEY:");
    console.log(`Key: ${activeKey}`);
    console.log("--------------------------------------------------");

    // Write or update .env.local
    const envPath = path.resolve(process.cwd(), ".env.local");
    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf-8");
    }

    if (!envContent.includes("CMS_API_KEY")) {
      const newLine = `\nCMS_API_KEY=${activeKey}\n`;
      fs.appendFileSync(envPath, newLine);
      console.log("Saved CMS_API_KEY to .env.local");
    }
  } else {
    console.log("API Key already exists in database.");
  }

  // 2. Check or create default Admin user
  const existingAdmins = await db.select().from(schema.admins).limit(1);
  if (existingAdmins.length === 0) {
    const adminId = `adm_${nanoid(16)}`;
    await db.insert(schema.admins).values({
      id: adminId,
      email: "admin@stackyup.com",
      passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890", // placeholder hash
      role: "admin",
    });
    console.log("Created default admin record (admin@stackyup.com)");
  }

  console.log("Database seeding completed.");
  return activeKey;
}

if (process.argv[1]?.includes("seed")) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seeding failed:", err);
      process.exit(1);
    });
}
