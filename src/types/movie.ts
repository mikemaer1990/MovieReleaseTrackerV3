export interface TMDBMovie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  genre_ids: number[]
  popularity: number
  vote_average: number
  vote_count: number
  adult: boolean
  original_language: string
  original_title: string
}

export interface TMDBMovieDetails extends TMDBMovie {
  genres: TMDBGenre[]
  runtime: number
  status: string
  tagline: string
  budget: number
  revenue: number
  production_companies: TMDBProductionCompany[]
  production_countries: TMDBProductionCountry[]
  spoken_languages: TMDBLanguage[]
  release_dates?: {
    results: TMDBReleaseDateResult[]
  }
}

export interface TMDBGenre {
  id: number
  name: string
}

export interface TMDBProductionCompany {
  id: number
  logo_path: string | null
  name: string
  origin_country: string
}

export interface TMDBProductionCountry {
  iso_3166_1: string
  name: string
}

export interface TMDBLanguage {
  english_name: string
  iso_639_1: string
  name: string
}

export interface TMDBReleaseDateResult {
  iso_3166_1: string // country code
  release_dates: TMDBReleaseDate[]
}

export interface TMDBReleaseDate {
  certification: string
  iso_639_1: string
  note: string
  release_date: string // ISO datetime
  type: number // Release type (1=Premiere, 2=Theatrical (limited), 3=Theatrical, 4=Digital, 5=Physical, 6=TV)
}

export interface TMDBSearchResponse {
  page: number
  results: TMDBMovie[]
  total_pages: number
  total_results: number
}

export interface UnifiedReleaseDates {
  usTheatrical: string | null
  streaming: string | null
  primary: string | null
  limited: string | null
  digital: string | null
}

export interface MovieWithDates extends TMDBMovieDetails {
  unifiedDates: UnifiedReleaseDates
}

// Database types (matching Prisma schema)
export type FollowType = 'THEATRICAL' | 'STREAMING' | 'BOTH'
export type NotificationType = 'THEATRICAL_RELEASE' | 'STREAMING_RELEASE' | 'DATE_DISCOVERED'
export type EmailStatus = 'SENT' | 'FAILED' | 'PENDING'

export interface Follow {
  id: string
  userId: string
  movieId: number
  followType: FollowType
  createdAt: Date
  movie?: Movie
}

export interface Movie {
  id: number
  title: string
  posterPath: string | null
  releaseDate: string | null
  overview: string | null
  genres: Record<string, unknown> | null // JSON
  popularity: number | null
  voteAverage: number | null
  createdAt: Date
  updatedAt: Date
  releaseDates?: ReleaseDate[]
}

export interface ReleaseDate {
  id: string
  movieId: number
  country: string
  releaseType: number
  releaseDate: string
  certification: string | null
  createdAt: Date
}