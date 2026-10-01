import PostEditor from "@/components/admin/PostEditor";

export const metadata = {
  title: "New Article — StackYup CMS Admin",
};

export default function NewPostPage() {
  return <PostEditor isEdit={false} />;
}
