import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import RedirectsClient from "./RedirectsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Redirects (301/302) — StackYup Admin",
};

export default async function AdminRedirectsPage() {
  const list = await db
    .select()
    .from(schema.redirects)
    .orderBy(desc(schema.redirects.createdAt));

  return <RedirectsClient initialRedirects={list} />;
}
