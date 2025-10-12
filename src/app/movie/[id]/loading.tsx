import { Card, CardContent } from '@/components/ui/card'

export default function MovieDetailsLoading() {
  return (
    <div className="min-h-screen">
      {/* Hero Section Skeleton */}
      <div className="relative w-full">
        {/* Backdrop Skeleton */}
        <div className="relative w-full h-[400px] md:h-[600px] bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%]" />

        {/* Hero Content */}
        <div className="container mx-auto px-4">
          <div className="relative flex flex-col md:flex-row gap-8 -mt-32 md:-mt-48">
            {/* Poster Skeleton */}
            <div className="flex-shrink-0 w-full md:w-80">
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-2xl ring-4 ring-primary/20">
                <div className="w-full h-full bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%]" />
              </div>
            </div>

            {/* Main Info Skeleton */}
            <div className="flex-1 space-y-5">
              {/* Title & Rating */}
              <div>
                <div className="flex flex-wrap items-start gap-4 mb-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-10 md:h-14 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%] rounded w-4/5" />
                    <div className="h-6 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%] rounded w-3/5 opacity-60" />
                  </div>
                  <div className="flex-shrink-0 w-24 h-20 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%] rounded-lg" />
                </div>

                {/* Quick Facts Bar */}
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <div className="h-5 w-16 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%] rounded" />
                  <div className="h-5 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%] rounded" />
                  <div className="h-5 w-24 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%] rounded" />
                </div>

                {/* Genres */}
                <div className="flex flex-wrap gap-2">
                  <div className="h-6 w-16 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%] rounded-full" />
                  <div className="h-6 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%] rounded-full" />
                  <div className="h-6 w-14 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%] rounded-full" />
                </div>
              </div>

              {/* Overview Card */}
              <Card className="bg-card/80 backdrop-blur">
                <CardContent className="p-4 space-y-2">
                  <div className="h-5 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%] rounded" />
                  <div className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%] rounded w-full" />
                  <div className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%] rounded w-full" />
                  <div className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%] rounded w-4/5" />
                </CardContent>
              </Card>

              {/* Release Dates Card */}
              <Card className="bg-card/50 backdrop-blur">
                <CardContent className="p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%] rounded" />
                      <div className="h-5 w-32 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%] rounded" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%] rounded" />
                      <div className="h-5 w-32 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%] rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Follow Buttons */}
              <div className="flex flex-wrap gap-3">
                <div className="h-11 w-36 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%] rounded" />
                <div className="h-11 w-36 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%] rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 space-y-12">
        {/* Details Grid */}
        <section>
          <div className="h-7 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%] rounded mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3 space-y-2">
                  <div className="h-3 w-16 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%] rounded" />
                  <div className="h-4 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%] rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Cast Section */}
        <section>
          <div className="h-7 w-16 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%] rounded mb-4" />

          {/* Desktop: Grid */}
          <div className="hidden lg:grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative aspect-[2/3] bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%]" />
                <CardContent className="p-2 space-y-1">
                  <div className="h-3 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%] rounded" />
                  <div className="h-3 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%] rounded w-3/4 opacity-60" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Mobile: Horizontal Scroll */}
          <div className="lg:hidden overflow-x-auto">
            <div className="flex gap-3 pb-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-32">
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative aspect-[2/3] bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%]" />
                    <CardContent className="p-2 space-y-1">
                      <div className="h-3 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%] rounded" />
                      <div className="h-3 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer bg-[length:200%_100%] rounded w-3/4 opacity-60" />
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
