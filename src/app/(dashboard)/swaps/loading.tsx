export default function SwapsLoading() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Shift Swaps &amp; Coverage
        </h2>
        <p className="text-sm text-gray-500">
          Manage open shifts, swap requests, and pickup coverage
        </p>
      </div>

      <div className="space-y-8">
        {/* Open Shifts skeleton */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
            <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="h-28 animate-pulse rounded-lg bg-gray-100" />
          </div>
        </section>

        {/* Requests skeleton with functional filter tabs */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
              <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
            </div>

            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                data-testid="swap-filter-pending"
                className="rounded-md px-4 py-2 text-sm font-medium bg-white text-gray-900 shadow-sm"
              >
                Pending
              </button>
              <button
                type="button"
                data-testid="swap-filter-all"
                className="rounded-md px-4 py-2 text-sm font-medium text-gray-500"
              >
                All
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="h-24 animate-pulse rounded-lg bg-gray-100" />
            <div className="h-24 animate-pulse rounded-lg bg-gray-100" />
          </div>
        </section>
      </div>
    </div>
  )
}
