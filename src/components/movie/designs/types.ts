import { TMDBEnhancedMovieDetails, UnifiedReleaseDates, FollowType, TMDBCast, TMDBCrew, TMDBVideo } from '@/types/movie'

export interface DesignProps {
  movie: TMDBEnhancedMovieDetails & { unifiedDates: UnifiedReleaseDates }
  isAuthenticated: boolean
  followTypes: FollowType[]
  followLoading: boolean
  onFollow: (followType: FollowType) => void
  onUnfollow: (followType: FollowType) => void
}

export interface DesignHelpers {
  isFollowingBoth: boolean
  isFollowingTheatrical: boolean
  isFollowingStreaming: boolean
  posterUrl: string | null
  backdropUrl: string | null
  trailers: TMDBVideo[]
  director: TMDBCrew | undefined
  mainCast: TMDBCast[]
  formatCurrency: (amount: number) => string
  formatRuntime: (minutes: number) => string
}
