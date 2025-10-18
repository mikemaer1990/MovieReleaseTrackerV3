/**
 * Environment Variable Validation
 *
 * Validates that all required environment variables are set before the app starts.
 * This prevents runtime errors and provides clear error messages.
 */

interface EnvVar {
  key: string
  description: string
  required: boolean
}

const ENV_VARS: EnvVar[] = [
  // Database
  {
    key: 'DATABASE_URL',
    description: 'PostgreSQL connection string (from Supabase or local)',
    required: true,
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    description: 'Supabase project URL',
    required: true,
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    description: 'Supabase anonymous/public key',
    required: true,
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    description: 'Supabase service role key (server-side only)',
    required: true,
  },

  // External APIs
  {
    key: 'TMDB_API_KEY',
    description: 'The Movie Database API key',
    required: true,
  },
  {
    key: 'BREVO_API_KEY',
    description: 'Brevo email service API key',
    required: true,
  },

  // Redis Cache
  {
    key: 'UPSTASH_REDIS_REST_URL',
    description: 'Upstash Redis REST URL',
    required: true,
  },
  {
    key: 'UPSTASH_REDIS_REST_TOKEN',
    description: 'Upstash Redis authentication token',
    required: true,
  },

  // Security
  {
    key: 'CRON_SECRET',
    description: 'Secret for authenticating cron job requests',
    required: true,
  },

  // Optional but recommended
  {
    key: 'NEXT_PUBLIC_APP_URL',
    description: 'Public URL of the application (for email links)',
    required: false,
  },
]

/**
 * Validate all required environment variables
 * @throws Error if any required variables are missing
 */
export function validateEnv(): void {
  // Only run on server-side
  if (typeof window !== 'undefined') {
    return
  }

  const missing: string[] = []
  const warnings: string[] = []

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.key]

    if (!value) {
      if (envVar.required) {
        missing.push(`  ❌ ${envVar.key}\n     ${envVar.description}`)
      } else {
        warnings.push(`  ⚠️  ${envVar.key}\n     ${envVar.description}`)
      }
    }
  }

  // Log warnings for optional variables
  if (warnings.length > 0) {
    console.warn('\n⚠️  Optional environment variables not set:\n')
    warnings.forEach(msg => console.warn(msg))
    console.warn('')
  }

  // Fail if required variables are missing
  if (missing.length > 0) {
    console.error('\n')
    console.error('═══════════════════════════════════════════════════════════')
    console.error('❌ MISSING REQUIRED ENVIRONMENT VARIABLES')
    console.error('═══════════════════════════════════════════════════════════')
    console.error('\nThe following environment variables are required:\n')
    missing.forEach(msg => console.error(msg))
    console.error('\n📝 Steps to fix:')
    console.error('   1. Copy .env.local.example to .env.local')
    console.error('   2. Fill in the required values')
    console.error('   3. Restart the development server')
    console.error('\n═══════════════════════════════════════════════════════════\n')

    throw new Error('Missing required environment variables')
  }

  console.log('✅ All required environment variables are set')
}

/**
 * Get an environment variable with type safety
 * @throws Error if variable is missing
 */
export function getEnvVar(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`)
  }
  return value
}

/**
 * Get an optional environment variable
 */
export function getOptionalEnvVar(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue
}
