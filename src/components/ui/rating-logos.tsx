// Rating service logo components using official brand logo images
import Image from 'next/image'

interface LogoProps {
  className?: string
}

export function TmdbLogo({ className = "h-6 w-6" }: LogoProps) {
  return (
    <div className={className}>
      <Image
        src="/logos/tmdb.svg"
        alt="TMDB"
        width={24}
        height={24}
        className="w-full h-full object-contain"
      />
    </div>
  )
}

export function ImdbLogo({ className = "h-6 w-6" }: LogoProps) {
  return (
    <div className={className}>
      <Image
        src="/logos/imdb.jpeg"
        alt="IMDb"
        width={24}
        height={24}
        className="w-full h-full object-cover rounded-full"
      />
    </div>
  )
}

export function RottenTomatoesLogo({ className = "h-6 w-6" }: LogoProps) {
  return (
    <div className={className}>
      <Image
        src="/logos/rotten-tomatoes.jpeg"
        alt="Rotten Tomatoes"
        width={24}
        height={24}
        className="w-full h-full object-cover rounded-full"
      />
    </div>
  )
}

export function MetacriticLogo({ className = "h-6 w-6" }: LogoProps) {
  return (
    <div className={className}>
      <Image
        src="/logos/metacritic.png"
        alt="Metacritic"
        width={24}
        height={24}
        className="w-full h-full object-contain"
      />
    </div>
  )
}
