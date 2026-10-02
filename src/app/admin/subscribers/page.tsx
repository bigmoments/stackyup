import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import SubscribersClient from "./SubscribersClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Subscribers — StackYup Admin",
};

export default async function AdminSubscribersPage() {
  const subscribersList = await db
    .select()
    .from(schema.subscribers)
    .orderBy(desc(schema.subscribers.createdAt));

  return <SubscribersClient initialSubscribers={subscribersList} />;
}
