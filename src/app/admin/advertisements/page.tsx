import { db, schema } from "@/db";
import AdvertisementsClient from "./AdvertisementsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Advertisements — StackYup Admin",
};

export default async function AdminAdvertisementsPage() {
  const placements = await db.select().from(schema.adPlacements);

  return <AdvertisementsClient initialPlacements={placements} />;
}
