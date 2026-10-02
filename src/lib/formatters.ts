/**
 * Response serializers to ensure snake_case field consistency across all API v1 endpoints
 */

export interface FormattedPost {
  id: string;
  title: string;
  slug: string;
  content_html: string;
  excerpt: string | null;
  meta_description: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  tags: string[];
  faq: Array<{ question: string; answer: string }>;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  claps: number;
  author_name: string;
  url?: string;
}

export function formatPostResponse(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  post: any,
  publicUrl?: string
): FormattedPost {
  const publishedAt = post.publishedAt ?? post.published_at;
  const createdAt = post.createdAt ?? post.created_at;
  const updatedAt = post.updatedAt ?? post.updated_at;

  const result: FormattedPost = {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content_html: post.contentHtml ?? post.content_html ?? "",
    excerpt: post.excerpt ?? null,
    meta_description: post.metaDescription ?? post.meta_description ?? null,
    featured_image_url: post.featuredImageUrl ?? post.featured_image_url ?? null,
    featured_image_alt: post.featuredImageAlt ?? post.featured_image_alt ?? null,
    tags: Array.isArray(post.tags) ? post.tags : [],
    faq: Array.isArray(post.faqJson)
      ? post.faqJson
      : Array.isArray(post.faq)
      ? post.faq
      : [],
    status: post.status,
    published_at: publishedAt
      ? publishedAt instanceof Date
        ? publishedAt.toISOString()
        : String(publishedAt)
      : null,
    created_at: createdAt
      ? createdAt instanceof Date
        ? createdAt.toISOString()
        : String(createdAt)
      : new Date().toISOString(),
    updated_at: updatedAt
      ? updatedAt instanceof Date
        ? updatedAt.toISOString()
        : String(updatedAt)
      : new Date().toISOString(),
    claps: Number(post.claps ?? 0),
    author_name: post.authorName ?? post.author_name ?? "Adit",
  };

  if (publicUrl) {
    result.url = publicUrl;
  }

  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatMediaResponse(media: any) {
  const createdAt = media.createdAt ?? media.created_at;
  return {
    id: media.id,
    filename: media.filename,
    url: media.url,
    alt: media.alt ?? null,
    width: media.width ?? null,
    height: media.height ?? null,
    size_bytes: media.sizeBytes ?? media.size_bytes ?? null,
    mime_type: media.mimeType ?? media.mime_type ?? null,
    created_at: createdAt
      ? createdAt instanceof Date
        ? createdAt.toISOString()
        : String(createdAt)
      : new Date().toISOString(),
  };
}
