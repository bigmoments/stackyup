export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-[#101313] animate-pulse">
      {/* Header Skeleton */}
      <div className="border-b border-[#E8ECE9] py-3.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="h-7 w-28 bg-[#F4FBF7] rounded-md border border-[#E8ECE9]" />
            <div className="hidden lg:flex items-center gap-4">
              <div className="h-4 w-14 bg-neutral-100 rounded" />
              <div className="h-4 w-16 bg-neutral-100 rounded" />
              <div className="h-4 w-20 bg-neutral-100 rounded" />
              <div className="h-4 w-16 bg-neutral-100 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-44 sm:w-60 bg-neutral-100 rounded-full" />
            <div className="h-9 w-9 bg-neutral-100 rounded-full" />
          </div>
        </div>
      </div>

      {/* Main Container Skeleton */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 w-full pt-6 pb-20">
        {/* Hero Section Skeleton */}
        <div className="rounded-2xl sm:rounded-3xl bg-[#F4FBF7] border border-[#E8ECE9] p-8 sm:p-10 mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="h-6 w-40 bg-white rounded-full border border-[#E8ECE9]" />
              <div className="h-10 w-4/5 bg-neutral-200/60 rounded-xl" />
              <div className="h-10 w-3/5 bg-neutral-200/60 rounded-xl" />
              <div className="h-4 w-full bg-neutral-200/40 rounded mt-3" />
              <div className="h-4 w-2/3 bg-neutral-200/40 rounded" />
              <div className="flex items-center gap-3 pt-3">
                <div className="h-11 w-44 bg-[#078a4b]/20 rounded-xl" />
                <div className="h-11 w-36 bg-white border border-[#E8ECE9] rounded-xl" />
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="h-56 bg-white rounded-2xl border border-[#E8ECE9]" />
            </div>
          </div>
        </div>

        {/* Featured Story Skeleton */}
        <div className="mb-14">
          <div className="h-6 w-36 bg-neutral-200/60 rounded mb-5" />
          <div className="rounded-2xl bg-white border border-[#E8ECE9] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
              <div className="lg:col-span-5 h-60 lg:h-72 bg-neutral-100" />
              <div className="lg:col-span-7 p-6 sm:p-8 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="h-4 w-48 bg-neutral-100 rounded" />
                  <div className="h-8 w-4/5 bg-neutral-200/60 rounded" />
                  <div className="h-4 w-full bg-neutral-100 rounded" />
                  <div className="h-4 w-2/3 bg-neutral-100 rounded" />
                </div>
                <div className="h-8 w-32 bg-neutral-100 rounded mt-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Feed & Sidebar Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14">
          {/* Main Grid */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#E8ECE9]">
              <div className="h-6 w-36 bg-neutral-200/60 rounded" />
              <div className="h-4 w-24 bg-neutral-100 rounded" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-[#E8ECE9] overflow-hidden">
                  <div className="aspect-video bg-neutral-100" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 w-32 bg-neutral-100 rounded" />
                    <div className="h-5 w-4/5 bg-neutral-200/60 rounded" />
                    <div className="h-4 w-full bg-neutral-100 rounded" />
                    <div className="h-4 w-1/2 bg-neutral-100 rounded" />
                    <div className="pt-4 border-t border-[#E8ECE9] flex justify-between">
                      <div className="h-4 w-20 bg-neutral-100 rounded" />
                      <div className="h-4 w-16 bg-neutral-100 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="lg:col-span-4 hidden lg:block border-l border-[#E8ECE9] pl-8 space-y-8">
            <div className="p-6 rounded-2xl bg-[#F4FBF7] border border-[#E8ECE9] space-y-3">
              <div className="h-5 w-32 bg-neutral-200/60 rounded" />
              <div className="h-4 w-full bg-neutral-100 rounded" />
              <div className="h-9 w-full bg-white rounded-lg border border-[#E8ECE9]" />
              <div className="h-9 w-full bg-[#078a4b]/20 rounded-lg" />
            </div>
            <div className="space-y-4">
              <div className="h-4 w-28 bg-neutral-200/60 rounded" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-16 h-11 bg-neutral-100 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-full bg-neutral-200/50 rounded" />
                    <div className="h-3 w-20 bg-neutral-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
