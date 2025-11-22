import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/services/email-service'
import { Movie } from '@/types/movie'

/**
 * Test endpoint to send sample emails
 *
 * SECURITY:
 * - Only works in development mode (NODE_ENV !== 'production')
 * - Protected by CRON_SECRET authorization header
 *
 * Usage:
 * GET /api/test/send-email?type=single-date&email=your@email.com
 * Headers: Authorization: Bearer YOUR_CRON_SECRET
 *
 * Types: test, single-date, batch-date, single-release, batch-release
 */
export async function GET(request: NextRequest) {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Test endpoints are disabled in production' },
      { status: 403 }
    )
  }

  // Check authorization
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter required' },
        { status: 400 }
      )
    }

    const user = {
      email,
      name: 'Test User'
    }

    // Sample movie data
    const sampleMovie: Movie = {
      id: 693134,
      title: 'Dune: Part Two',
      posterPath: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
      releaseDate: '2024-02-27',
      overview: 'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family.',
      genres: [
        { id: 878, name: 'Science Fiction' },
        { id: 12, name: 'Adventure' }
      ],
      popularity: 1234.56,
      voteAverage: 8.4,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const sampleMovie2: Movie = {
      id: 748783,
      title: 'The Garfield Movie',
      posterPath: '/p6AbOJvMQhBmffd0PIv0u8ghWeY.jpg',
      releaseDate: '2024-04-30',
      overview: 'Garfield, the world-famous, Monday-hating, lasagna-loving indoor cat, is about to have a wild outdoor adventure!',
      genres: [
        { id: 16, name: 'Animation' },
        { id: 35, name: 'Comedy' }
      ],
      popularity: 987.65,
      voteAverage: 7.1,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    switch (type) {
      case 'test':
        await emailService.sendTestEmail(email)
        return NextResponse.json({
          success: true,
          message: 'Test email sent successfully'
        })

      case 'single-date':
        await emailService.sendDateDiscoveredEmail(user, {
          movie: sampleMovie,
          theatricalDate: '2024-03-15',
          streamingDate: null
        })
        return NextResponse.json({
          success: true,
          message: 'Single date discovered email sent successfully'
        })

      case 'batch-date':
        await emailService.sendBatchDateDiscoveredEmail(user, [
          {
            movie: sampleMovie,
            theatricalDate: '2024-03-15',
            streamingDate: '2024-05-20'
          },
          {
            movie: sampleMovie2,
            theatricalDate: null,
            streamingDate: '2024-06-01'
          }
        ])
        return NextResponse.json({
          success: true,
          message: 'Batch date discovered email sent successfully'
        })

      case 'single-release':
        await emailService.sendReleaseEmail(user, sampleMovie, 'theatrical')
        return NextResponse.json({
          success: true,
          message: 'Single release email sent successfully'
        })

      case 'batch-release':
        await emailService.sendBatchReleaseEmail(
          user,
          [sampleMovie],
          [sampleMovie2]
        )
        return NextResponse.json({
          success: true,
          message: 'Batch release email sent successfully'
        })

      default:
        return NextResponse.json(
          {
            error: 'Invalid type parameter. Use: test, single-date, batch-date, single-release, or batch-release'
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      {
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
