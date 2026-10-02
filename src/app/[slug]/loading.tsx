export default function ArticleLoading() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-[#101313] animate-pulse">
      {/* Header Bar */}
      <div className="border-b border-[#E8ECE9] py-3.5 px-4 sm:px-6">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between">
          <div className="h-7 w-28 bg-[#F4FBF7] rounded-md border border-[#E8ECE9]" />
          <div className="h-9 w-44 bg-neutral-100 rounded-full" />
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-6 pt-5 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-start">
          {/* Main Article Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Breadcrumb Skeleton */}
            <div className="h-4 w-52 bg-neutral-100 rounded" />

            {/* Tags Skeleton */}
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-[#F4FBF7] rounded-full border border-[#E8ECE9]" />
              <div className="h-6 w-24 bg-neutral-100 rounded-full" />
            </div>

            {/* Title Skeleton */}
            <div className="space-y-3 pt-2">
              <div className="h-10 sm:h-12 w-11/12 bg-neutral-200/70 rounded-xl" />
              <div className="h-10 sm:h-12 w-3/4 bg-neutral-200/70 rounded-xl" />
              <div className="h-5 w-4/5 bg-neutral-200/40 rounded mt-3" />
            </div>

            {/* Byline Skeleton */}
            <div className="flex items-center justify-between py-4 border-b border-[#E8ECE9]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-200" />
                <div className="space-y-1.5">
                  <div className="h-4 w-28 bg-neutral-200/60 rounded" />
                  <div className="h-3 w-36 bg-neutral-100 rounded" />
                </div>
              </div>
              <div className="h-4 w-48 bg-neutral-100 rounded" />
            </div>

            {/* Hero Image 16:9 Skeleton */}
            <div className="w-full aspect-video rounded-xl bg-neutral-100 border border-[#E8ECE9]" />

            {/* Key Takeaways Box Skeleton */}
            <div className="p-6 rounded-2xl bg-[#F4FBF7] border border-[#E8ECE9] space-y-3">
              <div className="h-5 w-36 bg-[#078a4b]/20 rounded" />
              <div className="space-y-2 pt-1">
                <div className="h-4 w-5/6 bg-neutral-200/50 rounded" />
                <div className="h-4 w-4/5 bg-neutral-200/50 rounded" />
                <div className="h-4 w-3/4 bg-neutral-200/50 rounded" />
              </div>
            </div>

            {/* Article Prose Skeleton */}
            <div className="space-y-4 pt-4">
              <div className="h-4 w-full bg-neutral-200/40 rounded" />
              <div className="h-4 w-full bg-neutral-200/40 rounded" />
              <div className="h-4 w-11/12 bg-neutral-200/40 rounded" />
              <div className="h-4 w-4/5 bg-neutral-200/40 rounded" />
              <div className="h-8 w-1/2 bg-neutral-200/60 rounded mt-8 mb-4" />
              <div className="h-4 w-full bg-neutral-200/40 rounded" />
              <div className="h-4 w-full bg-neutral-200/40 rounded" />
              <div className="h-4 w-5/6 bg-neutral-200/40 rounded" />
            </div>
          </div>

          {/* Sticky Sidebar Skeleton */}
          <div className="lg:col-span-4 hidden lg:block border-l border-[#E8ECE9] pl-6 space-y-6">
            <div className="p-5 rounded-2xl bg-white border border-[#E8ECE9] space-y-3">
              <div className="h-4 w-32 bg-neutral-200/60 rounded" />
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-neutral-200" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-24 bg-neutral-200/60 rounded" />
                  <div className="h-3 w-32 bg-neutral-100 rounded" />
                </div>
              </div>
              <div className="h-9 w-full bg-[#078a4b]/20 rounded-lg" />
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E8ECE9] space-y-3">
              <div className="h-4 w-36 bg-neutral-200/60 rounded" />
              <div className="space-y-2">
                <div className="h-3 w-4/5 bg-neutral-100 rounded" />
                <div className="h-3 w-3/4 bg-neutral-100 rounded" />
                <div className="h-3 w-5/6 bg-neutral-100 rounded" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
