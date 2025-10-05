'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star, Film, Tv, Plus, Check, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock movie data for testing
const mockMovies = [
  {
    id: 1,
    title: "Avatar: Fire and Ash",
    poster_path: "/cf7hE1ifY4UNbS25tGnaTyyDrI2.jpg",
    vote_average: 8.2,
    release_date: "2025-12-19",
    unifiedDates: { usTheatrical: "2025-12-19", streaming: "2026-03-15" }
  },
  {
    id: 2,
    title: "Dune: Part Three",
    poster_path: "/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
    vote_average: 8.7,
    release_date: "2026-07-17",
    unifiedDates: { usTheatrical: "2026-07-17", streaming: "2026-10-20" }
  },
  {
    id: 3,
    title: "The Batman Part II",
    poster_path: "/74xTEgt2181O2u1DNOAJ5YdRBoG.jpg",
    vote_average: 7.9,
    release_date: "2025-10-03",
    unifiedDates: { usTheatrical: "2025-10-03", streaming: "2025-12-15" }
  },
  {
    id: 4,
    title: "Spider-Man: Beyond the Spider-Verse",
    poster_path: "/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
    vote_average: 8.4,
    release_date: "2025-06-29",
    unifiedDates: { usTheatrical: "2025-06-29", streaming: "2025-09-10" }
  },
  {
    id: 5,
    title: "Blade",
    poster_path: "/2BXMzTCF2KvHIXRk4OkdIk2w4mK.jpg",
    vote_average: 7.2,
    release_date: "2025-11-07",
    unifiedDates: { usTheatrical: "2025-11-07", streaming: "2026-01-20" }
  },
  {
    id: 6,
    title: "Fantastic Four",
    poster_path: "/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
    vote_average: 7.8,
    release_date: "2025-07-25",
    unifiedDates: { usTheatrical: "2025-07-25", streaming: "2025-10-05" }
  }
]

const getPosterUrl = (path: string) => `https://image.tmdb.org/t/p/w342${path}`
const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export default function TestCardsPage() {
  const [gridCols, setGridCols] = useState<2 | 3 | 4 | 5 | 6>(4)

  const getGridClasses = (cols: 2 | 3 | 4 | 5 | 6) => {
    switch(cols) {
      case 2: return "grid-cols-1 md:grid-cols-2"
      case 3: return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      case 4: return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      case 5: return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
      case 6: return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6"
      default: return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Movie Card Size Testing</h1>
          <p className="text-gray-400 mb-4">
            Compare different card sizes and layouts to find the optimal design
          </p>

          {/* Grid Controls */}
          <div className="flex gap-2 mb-6">
            <span className="text-white text-sm">Grid Density:</span>
            {([2, 3, 4, 5, 6] as const).map((cols) => (
              <Button
                key={cols}
                size="sm"
                variant={gridCols === cols ? "default" : "outline"}
                onClick={() => setGridCols(cols)}
                className="text-xs"
              >
                {cols} cols
              </Button>
            ))}
          </div>

          {/* Size Comparison Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <Card className="p-4">
              <h3 className="font-semibold text-lg mb-2">🔍 Size Comparison</h3>
              <div className="space-y-2 text-sm">
                <div><Badge variant="outline">Current</Badge> 3:4 aspect, full features</div>
                <div><Badge variant="outline">Compact</Badge> 2:3 aspect, ~25% shorter</div>
                <div><Badge variant="outline">Fixed</Badge> 192px height, ~50% shorter</div>
                <div><Badge variant="outline">Ultra</Badge> 128px height, ~66% shorter</div>
                <div><Badge variant="outline">Horizontal</Badge> 128px height, side layout</div>
                <div><Badge variant="outline">FAB</Badge> 3:4 aspect, Netflix-style</div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold text-lg mb-2">📐 Dimensions</h3>
              <div className="space-y-2 text-sm">
                <div>Current: Tallest cards (~320px)</div>
                <div>Compact: Medium height (~250px)</div>
                <div>Fixed: Capped height (~240px)</div>
                <div>Ultra: Very short (~180px)</div>
                <div>Horizontal: Consistent (128px)</div>
                <div>FAB: Current + Netflix UX</div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold text-lg mb-2">⚡ Performance</h3>
              <div className="space-y-2 text-sm">
                <div>More cards per screen = faster browsing</div>
                <div>Smaller cards = better mobile experience</div>
                <div>FAB = Netflix-like premium feel</div>
                <div>Horizontal = consistent spacing</div>
              </div>
            </Card>
          </div>
        </div>

        {/* Card Variations */}
        <div className="space-y-12">
          {/* Current Size (Baseline) */}
          <section>
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-white mb-2">A. Current Size (Baseline)</h2>
              <p className="text-gray-400 text-sm">Existing card design with full features</p>
            </div>
            <div className={cn("grid gap-6", getGridClasses(gridCols))}>
              {mockMovies.map((movie) => (
                <CurrentCard key={`current-${movie.id}`} movie={movie} />
              ))}
            </div>
          </section>

          {/* Compact Card */}
          <section>
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-white mb-2">B. Compact Card</h2>
              <p className="text-gray-400 text-sm">Shorter aspect ratio, reduced padding, smaller text</p>
            </div>
            <div className={cn("grid gap-6", getGridClasses(gridCols))}>
              {mockMovies.map((movie) => (
                <CompactCard key={`compact-${movie.id}`} movie={movie} />
              ))}
            </div>
          </section>

          {/* Fixed Height Card */}
          <section>
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-white mb-2">C. Fixed Height Card</h2>
              <p className="text-gray-400 text-sm">Capped poster height (192px), maintains aspect ratio</p>
            </div>
            <div className={cn("grid gap-6", getGridClasses(gridCols))}>
              {mockMovies.map((movie) => (
                <FixedHeightCard key={`fixed-${movie.id}`} movie={movie} />
              ))}
            </div>
          </section>

          {/* Ultra-Compact Card */}
          <section>
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-white mb-2">D. Ultra-Compact Card</h2>
              <p className="text-gray-400 text-sm">Very small poster (128px), maximum cards per screen</p>
            </div>
            <div className={cn("grid gap-6", getGridClasses(gridCols))}>
              {mockMovies.map((movie) => (
                <UltraCompactCard key={`ultra-${movie.id}`} movie={movie} />
              ))}
            </div>
          </section>

          {/* Horizontal Card */}
          <section>
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-white mb-2">E. Horizontal Card</h2>
              <p className="text-gray-400 text-sm">Fixed height, poster on left, content on right</p>
            </div>
            <div className={cn("grid gap-6", getGridClasses(gridCols))}>
              {mockMovies.map((movie) => (
                <HorizontalCard key={`horizontal-${movie.id}`} movie={movie} />
              ))}
            </div>
          </section>

          {/* FAB Card with Vertical Poster */}
          <section>
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-white mb-2">F. FAB Card with Vertical Poster ⭐</h2>
              <p className="text-gray-400 text-sm">Netflix-style FAB functionality with proper vertical movie poster</p>
            </div>
            <div className={cn("grid gap-6", getGridClasses(gridCols))}>
              {mockMovies.map((movie) => (
                <FABCard key={`fab-${movie.id}`} movie={movie} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

// Current Card Component (Baseline)
function CurrentCard({ movie }: { movie: typeof mockMovies[0] }) {
  const [followTypes, setFollowTypes] = useState<string[]>([])

  const toggleFollow = (type: string) => {
    setFollowTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
      <div className="relative aspect-[3/4] bg-muted">
        <Image
          src={getPosterUrl(movie.poster_path)}
          alt={movie.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {movie.vote_average > 0 && (
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
            <Star className="h-3 w-3 fill-current text-yellow-400" />
            <span>{movie.vote_average.toFixed(1)}</span>
          </div>
        )}
      </div>

      <CardContent className="p-3 flex-grow">
        <h3 className="font-semibold text-lg mb-2 truncate" title={movie.title}>
          {movie.title}
        </h3>

        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center">
            <Film className="h-3 w-3 mr-1 text-yellow-500" />
            <span className="text-foreground font-medium">
              {formatDate(movie.unifiedDates.usTheatrical)}
            </span>
          </div>
          <div className="flex items-center">
            <Tv className="h-3 w-3 mr-1 text-amber-500" />
            <span className="text-foreground font-medium">
              {formatDate(movie.unifiedDates.streaming)}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-0 space-y-2 mt-auto">
        <div className="w-full space-y-2">
          <Button variant="outline" size="sm" className="w-full">
            View Details
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => toggleFollow('theater')}
              className={`flex items-center gap-1.5 transition-colors duration-200 ${
                followTypes.includes('theater')
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black border-yellow-500'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {followTypes.includes('theater') ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              <span>Theater</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => toggleFollow('streaming')}
              className={`flex items-center gap-1.5 transition-colors duration-200 ${
                followTypes.includes('streaming')
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-black border-amber-600'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {followTypes.includes('streaming') ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              <span>Streaming</span>
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

// Compact Card Component
function CompactCard({ movie }: { movie: typeof mockMovies[0] }) {
  const [followTypes, setFollowTypes] = useState<string[]>([])

  const toggleFollow = (type: string) => {
    setFollowTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
      <div className="relative aspect-[2/3] bg-muted">
        <Image
          src={getPosterUrl(movie.poster_path)}
          alt={movie.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {movie.vote_average > 0 && (
          <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded flex items-center space-x-1">
            <Star className="h-2.5 w-2.5 fill-current text-yellow-400" />
            <span className="text-xs">{movie.vote_average.toFixed(1)}</span>
          </div>
        )}
      </div>

      <CardContent className="p-2 flex-grow">
        <h3 className="font-semibold text-sm mb-1 truncate" title={movie.title}>
          {movie.title}
        </h3>

        <div className="flex items-center justify-between text-xs mb-1">
          <div className="flex items-center">
            <Film className="h-2.5 w-2.5 mr-1 text-yellow-500" />
            <span className="text-foreground font-medium text-xs">
              {formatDate(movie.unifiedDates.usTheatrical)}
            </span>
          </div>
          <div className="flex items-center">
            <Tv className="h-2.5 w-2.5 mr-1 text-amber-500" />
            <span className="text-foreground font-medium text-xs">
              {formatDate(movie.unifiedDates.streaming)}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-2 pt-0 mt-auto">
        <div className="w-full space-y-1">
          <Button variant="outline" size="sm" className="w-full text-xs h-7">
            Details
          </Button>

          <div className="grid grid-cols-2 gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => toggleFollow('theater')}
              className={`flex items-center gap-1 transition-colors duration-200 text-xs h-6 ${
                followTypes.includes('theater')
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black border-yellow-500'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {followTypes.includes('theater') ? <Check className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
              <span>Theater</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => toggleFollow('streaming')}
              className={`flex items-center gap-1 transition-colors duration-200 text-xs h-6 ${
                followTypes.includes('streaming')
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-black border-amber-600'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {followTypes.includes('streaming') ? <Check className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
              <span>Stream</span>
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

// Fixed Height Card Component
function FixedHeightCard({ movie }: { movie: typeof mockMovies[0] }) {
  const [followTypes, setFollowTypes] = useState<string[]>([])

  const toggleFollow = (type: string) => {
    setFollowTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
      <div className="relative h-48 bg-muted">
        <Image
          src={getPosterUrl(movie.poster_path)}
          alt={movie.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {movie.vote_average > 0 && (
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded flex items-center space-x-1">
            <Star className="h-2.5 w-2.5 fill-current text-yellow-400" />
            <span className="text-xs">{movie.vote_average.toFixed(1)}</span>
          </div>
        )}
      </div>

      <CardContent className="p-2 flex-grow">
        <h3 className="font-semibold text-sm mb-1 truncate" title={movie.title}>
          {movie.title}
        </h3>

        <div className="flex items-center justify-between text-xs mb-1">
          <div className="flex items-center">
            <Film className="h-2.5 w-2.5 mr-1 text-yellow-500" />
            <span className="text-foreground font-medium text-xs">
              {formatDate(movie.unifiedDates.usTheatrical)}
            </span>
          </div>
          <div className="flex items-center">
            <Tv className="h-2.5 w-2.5 mr-1 text-amber-500" />
            <span className="text-foreground font-medium text-xs">
              {formatDate(movie.unifiedDates.streaming)}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-2 pt-0 mt-auto">
        <div className="w-full space-y-1">
          <div className="grid grid-cols-2 gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => toggleFollow('theater')}
              className={`flex items-center gap-1 transition-colors duration-200 text-xs h-6 ${
                followTypes.includes('theater')
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black border-yellow-500'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {followTypes.includes('theater') ? <Check className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
              <span>Theater</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => toggleFollow('streaming')}
              className={`flex items-center gap-1 transition-colors duration-200 text-xs h-6 ${
                followTypes.includes('streaming')
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-black border-amber-600'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {followTypes.includes('streaming') ? <Check className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
              <span>Stream</span>
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

// Ultra-Compact Card Component
function UltraCompactCard({ movie }: { movie: typeof mockMovies[0] }) {
  const [followTypes, setFollowTypes] = useState<string[]>([])

  const toggleFollow = (type: string) => {
    setFollowTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
      <div className="relative h-32 bg-muted">
        <Image
          src={getPosterUrl(movie.poster_path)}
          alt={movie.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {movie.vote_average > 0 && (
          <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded flex items-center space-x-0.5">
            <Star className="h-2 w-2 fill-current text-yellow-400" />
            <span className="text-xs">{movie.vote_average.toFixed(1)}</span>
          </div>
        )}
      </div>

      <CardContent className="p-1.5 flex-grow">
        <h3 className="font-medium text-xs mb-1 truncate" title={movie.title}>
          {movie.title}
        </h3>

        <div className="flex items-center justify-between text-xs">
          <div className="flex gap-1">
            <span className="text-xs">🎬</span>
            <span className="text-xs">📺</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => toggleFollow('theater')}
              className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                followTypes.includes('theater') ? 'bg-yellow-500 text-black' : 'bg-zinc-700 text-white'
              }`}
            >
              🎬
            </button>
            <button
              onClick={() => toggleFollow('streaming')}
              className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                followTypes.includes('streaming') ? 'bg-amber-500 text-black' : 'bg-zinc-700 text-white'
              }`}
            >
              📺
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Horizontal Card Component
function HorizontalCard({ movie }: { movie: typeof mockMovies[0] }) {
  const [followTypes, setFollowTypes] = useState<string[]>([])

  const toggleFollow = (type: string) => {
    setFollowTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow flex flex-row h-32">
      <div className="relative w-24 bg-muted flex-shrink-0">
        <Image
          src={getPosterUrl(movie.poster_path)}
          alt={movie.title}
          fill
          className="object-cover"
          sizes="96px"
        />
        {movie.vote_average > 0 && (
          <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded flex items-center space-x-0.5">
            <Star className="h-2 w-2 fill-current text-yellow-400" />
            <span className="text-xs">{movie.vote_average.toFixed(1)}</span>
          </div>
        )}
      </div>

      <div className="flex-1 p-2 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-sm mb-1 truncate" title={movie.title}>
            {movie.title}
          </h3>

          <div className="space-y-1 text-xs">
            <div className="flex items-center">
              <Film className="h-2.5 w-2.5 mr-1 text-yellow-500" />
              <span className="text-foreground">
                {formatDate(movie.unifiedDates.usTheatrical)}
              </span>
            </div>
            <div className="flex items-center">
              <Tv className="h-2.5 w-2.5 mr-1 text-amber-500" />
              <span className="text-foreground">
                {formatDate(movie.unifiedDates.streaming)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-1 mt-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => toggleFollow('theater')}
            className={`flex items-center gap-0.5 transition-colors duration-200 text-xs h-6 px-2 ${
              followTypes.includes('theater')
                ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black'
                : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            {followTypes.includes('theater') ? <Check className="h-2 w-2" /> : <Plus className="h-2 w-2" />}
            🎬
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => toggleFollow('streaming')}
            className={`flex items-center gap-0.5 transition-colors duration-200 text-xs h-6 px-2 ${
              followTypes.includes('streaming')
                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-black'
                : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              }`}
          >
            {followTypes.includes('streaming') ? <Check className="h-2 w-2" /> : <Plus className="h-2 w-2" />}
            📺
          </Button>
        </div>
      </div>
    </Card>
  )
}

// FAB Card Component with Vertical Poster
function FABCard({ movie }: { movie: typeof mockMovies[0] }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [followTypes, setFollowTypes] = useState<string[]>([])

  const toggleFollow = (type: string) => {
    setFollowTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const getMainButtonContent = () => {
    if (followTypes.length === 2) {
      return <Check className="h-4 w-4" />
    } else if (followTypes.length === 1) {
      return followTypes.includes('theater') ? '🎬' : '📺'
    } else {
      return <Plus className="h-4 w-4" />
    }
  }

  const getMainButtonColor = () => {
    if (followTypes.length === 2) {
      return 'bg-green-600 hover:bg-green-700'
    } else if (followTypes.includes('theater')) {
      return 'bg-yellow-500 hover:bg-yellow-600'
    } else if (followTypes.includes('streaming')) {
      return 'bg-yellow-500 hover:bg-yellow-600'
    } else {
      return 'bg-yellow-500 hover:bg-yellow-600'
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all relative group bg-black">
      <div className="relative aspect-[3/4] bg-black">
        <Image
          src={getPosterUrl(movie.poster_path)}
          alt={movie.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        {/* Netflix-style gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* FAB */}
        <div className="absolute top-3 right-3 z-10">
          {/* Expanded options */}
          {isExpanded && (
            <div className="absolute top-12 right-0 space-y-2 animate-in slide-in-from-top">
              <div className="flex items-center gap-2">
                <span className="text-white text-xs bg-black/80 px-2 py-1 rounded-full whitespace-nowrap font-medium">
                  Theater
                </span>
                <Button
                  size="sm"
                  onClick={() => toggleFollow('theater')}
                  className={`w-10 h-10 rounded-full p-0 shadow-xl border-2 border-white/20 ${
                    followTypes.includes('theater')
                      ? 'bg-yellow-500 hover:bg-yellow-600'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  {followTypes.includes('theater') ? <Check className="h-4 w-4" /> : '🎬'}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white text-xs bg-black/80 px-2 py-1 rounded-full whitespace-nowrap font-medium">
                  Streaming
                </span>
                <Button
                  size="sm"
                  onClick={() => toggleFollow('streaming')}
                  className={`w-10 h-10 rounded-full p-0 shadow-xl border-2 border-white/20 ${
                    followTypes.includes('streaming')
                      ? 'bg-yellow-500 hover:bg-yellow-600'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  {followTypes.includes('streaming') ? <Check className="h-4 w-4" /> : '📺'}
                </Button>
              </div>
            </div>
          )}

          {/* Main FAB button */}
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-12 h-12 rounded-full p-0 text-white shadow-xl border-2 border-white/20 transition-all hover:scale-110 ${getMainButtonColor()}`}
          >
            {isExpanded ? '✕' : getMainButtonContent()}
          </Button>

          {/* Follow hint on hover */}
          {!isExpanded && (
            <div className="absolute top-14 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black/90 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap border border-white/20">
                Follow releases
              </div>
            </div>
          )}
        </div>

        {/* Netflix-style title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
          <h3 className="font-bold text-base mb-1">{movie.title}</h3>
          <div className="flex items-center gap-3 text-xs text-gray-300">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              ⭐ {movie.vote_average}
            </span>
            <span>🎬 {formatDate(movie.unifiedDates.usTheatrical)}</span>
            <span>📺 {formatDate(movie.unifiedDates.streaming)}</span>
          </div>
        </div>

        {/* Follow status badge */}
        {followTypes.length > 0 && (
          <div className="absolute bottom-16 left-3 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-medium">
            {followTypes.length === 2 ? 'Following Both' :
             followTypes.includes('theater') ? 'Following Theater' :
             'Following Streaming'}
          </div>
        )}
      </div>
    </Card>
  )
}