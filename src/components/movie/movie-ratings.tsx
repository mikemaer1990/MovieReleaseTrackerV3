import Link from 'next/link'
import { MovieRatings } from '@/types/movie'
import { TmdbLogo, ImdbLogo, RottenTomatoesLogo, MetacriticLogo } from '@/components/ui/rating-logos'
import { cn } from '@/lib/utils'

interface MovieRatingsProps {
  ratings: MovieRatings
  className?: string
}

export function MovieRatingsDisplay({ ratings, className }: MovieRatingsProps) {
  // Only show if we have at least one rating
  const hasRatings = ratings.tmdb || ratings.imdb || ratings.rottenTomatoes || ratings.metacritic
  if (!hasRatings) return null

  return (
    <div className={cn('w-full', className)}>
      <div className="flex flex-wrap items-center gap-2">
        {/* TMDB Rating */}
        {ratings.tmdb && (
          <RatingBadge
            href={ratings.tmdb.url}
            logo={<TmdbLogo className="h-4 w-4" />}
            score={ratings.tmdb.score.toFixed(1)}
            color="tmdb"
          />
        )}

        {/* IMDb Rating */}
        {ratings.imdb && (
          <RatingBadge
            href={ratings.imdb.url}
            logo={<ImdbLogo className="h-4 w-4" />}
            score={ratings.imdb.score}
            color="imdb"
          />
        )}

        {/* Rotten Tomatoes Rating */}
        {ratings.rottenTomatoes && (
          <RatingBadge
            href={ratings.rottenTomatoes.url || '#'}
            logo={<RottenTomatoesLogo className="h-4 w-4" />}
            score={ratings.rottenTomatoes.score}
            color="rt"
          />
        )}

        {/* Metacritic Rating */}
        {ratings.metacritic && (
          <RatingBadge
            href={ratings.metacritic.url || '#'}
            logo={<MetacriticLogo className="h-4 w-4" />}
            score={ratings.metacritic.score}
            color="metacritic"
          />
        )}
      </div>
    </div>
  )
}

interface RatingBadgeProps {
  href: string
  logo: React.ReactNode
  score: string
  color: 'tmdb' | 'imdb' | 'rt' | 'metacritic'
  scoreColor?: string
}

function RatingBadge({ href, logo, score, color, scoreColor }: RatingBadgeProps) {
  const colorClasses = {
    tmdb: 'border-[#01b4e4]/40 hover:border-[#01b4e4] hover:bg-[#01b4e4]/10',
    imdb: 'border-[#F5C518]/40 hover:border-[#F5C518] hover:bg-[#F5C518]/10',
    rt: 'border-[#FA320A]/40 hover:border-[#FA320A] hover:bg-[#FA320A]/10',
    metacritic: 'border-[#FFCC33]/40 hover:border-[#FFCC33] hover:bg-[#FFCC33]/10',
  }

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-200',
        'bg-card/50 backdrop-blur-sm',
        colorClasses[color]
      )}
    >
      {/* Logo */}
      <div className="flex-shrink-0">{logo}</div>

      {/* Score */}
      <div
        className={cn(
          'text-sm font-semibold leading-none',
          scoreColor || 'text-foreground'
        )}
      >
        {score}
      </div>
    </Link>
  )
}
