export default function StaticPageLoading() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-[#101313] animate-pulse">
      <div className="border-b border-[#E8ECE9] py-3.5 px-4 sm:px-6">
        <div className="max-w-[760px] mx-auto flex items-center justify-between">
          <div className="h-7 w-28 bg-[#F4FBF7] rounded-md border border-[#E8ECE9]" />
        </div>
      </div>

      <main className="flex-1 max-w-[760px] mx-auto px-4 sm:px-6 py-10 w-full space-y-6">
        <div className="h-4 w-24 bg-neutral-100 rounded" />
        <div className="h-10 w-2/3 bg-neutral-200/70 rounded-xl" />
        <div className="h-3 w-32 bg-neutral-100 rounded" />
        <div className="pt-6 space-y-4 border-t border-[#E8ECE9]">
          <div className="h-4 w-full bg-neutral-200/40 rounded" />
          <div className="h-4 w-full bg-neutral-200/40 rounded" />
          <div className="h-4 w-4/5 bg-neutral-200/40 rounded" />
          <div className="h-4 w-5/6 bg-neutral-200/40 rounded" />
        </div>
      </main>
    </div>
  );
}
