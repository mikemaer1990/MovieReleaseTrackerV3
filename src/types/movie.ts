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
  genres: Record<string, unknown> | { id: number; name: string }[] | null
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

// TMDB Credits Types
export interface TMDBCast {
  adult: boolean
  gender: number | null
  id: number
  known_for_department: string
  name: string
  original_name: string
  popularity: number
  profile_path: string | null
  cast_id: number
  character: string
  credit_id: string
  order: number
}

export interface TMDBCrew {
  adult: boolean
  gender: number | null
  id: number
  known_for_department: string
  name: string
  original_name: string
  popularity: number
  profile_path: string | null
  credit_id: string
  department: string
  job: string
}

export interface TMDBCredits {
  id: number
  cast: TMDBCast[]
  crew: TMDBCrew[]
}

// TMDB Video Types
export interface TMDBVideo {
  iso_639_1: string
  iso_3166_1: string
  name: string
  key: string
  site: string
  size: number
  type: string // 'Trailer', 'Teaser', 'Clip', 'Featurette', 'Behind the Scenes'
  official: boolean
  published_at: string
  id: string
}

export interface TMDBVideos {
  id: number
  results: TMDBVideo[]
}

// TMDB Images Types
export interface TMDBImage {
  aspect_ratio: number
  height: number
  iso_639_1: string | null
  file_path: string
  vote_average: number
  vote_count: number
  width: number
}

export interface TMDBImages {
  id: number
  backdrops: TMDBImage[]
  logos: TMDBImage[]
  posters: TMDBImage[]
}

// TMDB Watch Providers Types
export interface TMDBWatchProvider {
  logo_path: string
  provider_id: number
  provider_name: string
  display_priority: number
}

export interface TMDBWatchProviderResult {
  link: string
  flatrate?: TMDBWatchProvider[] // Subscription services
  rent?: TMDBWatchProvider[]
  buy?: TMDBWatchProvider[]
}

export interface TMDBWatchProviders {
  id: number
  results: {
    [countryCode: string]: TMDBWatchProviderResult
  }
}

// TMDB Reviews Types
export interface TMDBReview {
  author: string
  author_details: {
    name: string
    username: string
    avatar_path: string | null
    rating: number | null
  }
  content: string
  created_at: string
  id: string
  updated_at: string
  url: string
}

export interface TMDBReviews {
  id: number
  page: number
  results: TMDBReview[]
  total_pages: number
  total_results: number
}

// TMDB External IDs Types
export interface TMDBExternalIds {
  imdb_id: string | null
  facebook_id: string | null
  instagram_id: string | null
  twitter_id: string | null
}

// Enhanced Movie Details with all append_to_response data
export interface TMDBEnhancedMovieDetails extends TMDBMovieDetails {
  credits?: TMDBCredits
  videos?: TMDBVideos
  images?: TMDBImages
  'watch/providers'?: TMDBWatchProviders
  similar?: TMDBSearchResponse
  recommendations?: TMDBSearchResponse
  reviews?: TMDBReviews
  external_ids?: TMDBExternalIds
}

// OMDB API Types
export interface OMDBRating {
  Source: string
  Value: string
}

export interface OMDBResponse {
  Title: string
  Year: string
  Rated: string
  Released: string
  Runtime: string
  Genre: string
  Director: string
  Writer: string
  Actors: string
  Plot: string
  Language: string
  Country: string
  Awards: string
  Poster: string
  Ratings: OMDBRating[]
  Metascore: string
  imdbRating: string
  imdbVotes: string
  imdbID: string
  Type: string
  DVD: string
  BoxOffice: string
  Production: string
  Website: string
  Response: string
  Error?: string
  // Rotten Tomatoes data (available with tomatoes=true parameter)
  tomatoURL?: string
  tomatoMeter?: string
  tomatoImage?: string
  tomatoRating?: string
  tomatoReviews?: string
  tomatoFresh?: string
  tomatoRotten?: string
  tomatoConsensus?: string
  tomatoUserMeter?: string
  tomatoUserRating?: string
  tomatoUserReviews?: string
}

// Unified Ratings from multiple sources
export interface MovieRatings {
  tmdb?: {
    score: number
    voteCount: number
    url: string
  }
  imdb?: {
    score: string
    url: string
  }
  rottenTomatoes?: {
    score: string
    url: string | null
  }
  metacritic?: {
    score: string
    url: string | null
  }
}