import { NextRequest, NextResponse } from 'next/server'
import { omdbService } from '@/lib/omdb'
import { MovieRatings } from '@/types/movie'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const imdbId = searchParams.get('imdbId')

    if (!imdbId) {
      return NextResponse.json({ ratings: {} })
    }

    console.log(`[API] Fetching OMDB ratings for IMDb ID: ${imdbId}`)
    const start = Date.now()

    const omdbRatings = await omdbService.getRatingsByImdbId(imdbId)
    const duration = Date.now() - start

    console.log(`[API] OMDB ratings fetched in ${duration}ms`)

    return NextResponse.json({ ratings: omdbRatings })
  } catch (error) {
    console.error('Error fetching OMDB ratings:', error)
    return NextResponse.json({ ratings: {} })
  }
}
