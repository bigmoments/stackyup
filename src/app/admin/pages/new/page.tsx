import PageEditor from "@/components/admin/PageEditor";

export const metadata = {
  title: "New Static Page — StackYup CMS Admin",
};

export default function NewPage() {
  return <PageEditor isEdit={false} />;
}
