import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/services/email-service'

/**
 * Test Email Notifications
 *
 * Comprehensive test of all email notification types
 *
 * Usage: GET http://localhost:3010/api/test/email-notifications
 */
export async function GET(request: NextRequest) {
  const testUser = {
    email: 'mikemaer1990@gmail.com',
    name: 'Mike'
  }

  const sampleMovie = {
    id: 967941,
    title: 'Wicked: For Good',
    posterPath: '/eJcExSSSJo6HkQeidJxOQFoNNfo.jpg',
    overview: 'The sequel to the first Wicked film.',
    releaseDate: '2025-11-16',
    voteAverage: 7.5,
    popularity: 850.5,
    genres: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const sampleMovie2 = {
    id: 402431,
    title: 'Wicked',
    posterPath: '/c5Tqxeo1UpBvnAc3csUm7j3hlQl.jpg',
    overview: 'Elphaba, a young woman misunderstood because of her green skin...',
    releaseDate: '2024-11-20',
    voteAverage: 7.8,
    popularity: 1250.3,
    genres: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
  const results = []

  try {
    // Test 1: Single Date Discovered (Theatrical)
    results.push('Test 1: Date Discovered - Single Movie (Theatrical)')
    await emailService.sendDateDiscoveredEmail(testUser, {
      movie: sampleMovie,
      theatricalDate: '2025-12-25', // Future date
      streamingDate: null
    })
    results.push('✅ Test 1 Complete')
    await delay(2000)

    // Test 2: Single Date Discovered (Streaming)
    results.push('Test 2: Date Discovered - Single Movie (Streaming)')
    await emailService.sendDateDiscoveredEmail(testUser, {
      movie: sampleMovie2,
      theatricalDate: null,
      streamingDate: '2026-01-15' // Future date
    })
    results.push('✅ Test 2 Complete')
    await delay(2000)

    // Test 3: Single Date Discovered (Both Dates)
    results.push('Test 3: Date Discovered - Single Movie (Both Dates)')
    await emailService.sendDateDiscoveredEmail(testUser, {
      movie: sampleMovie,
      theatricalDate: '2025-11-21',
      streamingDate: '2026-02-14'
    })
    results.push('✅ Test 3 Complete')
    await delay(2000)

    // Test 4: Batch Date Discovered
    results.push('Test 4: Date Discovered - Multiple Movies (Batch)')
    await emailService.sendBatchDateDiscoveredEmail(testUser, [
      {
        movie: sampleMovie,
        theatricalDate: '2025-11-21',
        streamingDate: null
      },
      {
        movie: sampleMovie2,
        theatricalDate: null,
        streamingDate: '2025-12-20'
      }
    ])
    results.push('✅ Test 4 Complete')
    await delay(2000)

    // Test 5: Single Release Notification (Theatrical)
    results.push('Test 5: Release Notification - Single Movie (Theatrical)')
    await emailService.sendReleaseEmail(testUser, sampleMovie, 'THEATRICAL')
    results.push('✅ Test 5 Complete')
    await delay(2000)

    // Test 6: Single Release Notification (Streaming)
    results.push('Test 6: Release Notification - Single Movie (Streaming)')
    await emailService.sendReleaseEmail(testUser, sampleMovie2, 'STREAMING')
    results.push('✅ Test 6 Complete')
    await delay(2000)

    // Test 7: Batch Release Notification
    results.push('Test 7: Release Notification - Multiple Movies (Batch)')
    await emailService.sendBatchReleaseEmail(
      testUser,
      [sampleMovie, sampleMovie2], // theatrical
      [sampleMovie] // streaming
    )
    results.push('✅ Test 7 Complete')

    return NextResponse.json({
      success: true,
      message: 'All test emails sent successfully!',
      recipient: testUser.email,
      testsRun: 7,
      results
    })

  } catch (error) {
    console.error('[EmailTest] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        results
      },
      { status: 500 }
    )
  }
}
