# Movie Release Tracker V2

A modern web application that helps users track upcoming movie releases and get notified when movies are available in theaters or on streaming platforms.

## 🎯 Overview

Follow your favorite upcoming movies and never miss a release! This app integrates with The Movie Database (TMDB) to provide real-time movie information and lets you track both theatrical and streaming releases.

## ✨ Features

- **🎬 Movie Discovery**: Search and browse popular/upcoming movies from TMDB
- **📅 Release Tracking**: Follow movies for theatrical and/or streaming releases
- **🔔 Smart Notifications**: Get notified when tracked movies become available
- **👤 User Authentication**: Secure sign-up and login with Supabase Auth
- **📱 Responsive Design**: Beautiful UI that works on all devices
- **⚡ Real-time Updates**: Optimistic UI updates for instant feedback

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL) with Prisma ORM
- **Authentication**: Supabase Auth
- **External APIs**: TMDB (The Movie Database)
- **Caching**: Upstash Redis
- **Email**: Brevo API for notifications
- **Testing**: Jest (unit tests) + Playwright (e2e tests)
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm
- Supabase account
- TMDB API key
- Upstash Redis account
- Brevo account (for emails)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mikemaer1990/MovieReleaseTrackerV3.git
   cd MovieReleaseTrackerV3
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Fill in your environment variables:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # TMDB
   TMDB_API_KEY=your_tmdb_api_key

   # Upstash Redis
   UPSTASH_REDIS_REST_URL=your_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_redis_token

   # Brevo Email
   BREVO_API_KEY=your_brevo_api_key

   # Security
   CRON_SECRET=your_cron_secret
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   npm run db:generate
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3010](http://localhost:3010)**

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── movies/        # Movie data endpoints
│   │   └── follows/       # Follow/unfollow endpoints
│   ├── auth/              # Auth pages (signin/signup)
│   ├── dashboard/         # User dashboard
│   ├── search/            # Movie search page
│   ├── upcoming/          # Upcoming movies page
│   └── test-fab/          # Card component testing
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── movie/            # Movie-specific components
│   └── providers/        # Context providers
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and configurations
│   ├── services/         # Business logic services
│   ├── supabase.ts       # Supabase client
│   ├── tmdb.ts           # TMDB API client
│   └── utils.ts          # Helper functions
├── types/                # TypeScript type definitions
└── prisma/               # Database schema
```

## 🎮 Available Scripts

### Development
- `npm run dev` - Start development server (with Turbopack)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:studio` - Open Prisma Studio

### Testing
- `npm test` - Run Jest unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:e2e` - Run Playwright e2e tests
- `npm run test:e2e:ui` - Run Playwright with UI

## 🎯 Key Features Deep Dive

### Movie Following System
- **Theatrical Releases**: Get notified when movies hit theaters
- **Streaming Releases**: Track when movies become available on streaming platforms
- **Flexible Tracking**: Follow both release types or choose specific ones

### Authentication & User Management
- Secure authentication with Supabase
- User profiles and preferences
- Protected routes and data

### Movie Data Integration
- Real-time movie information from TMDB
- Automatic release date discovery
- Comprehensive movie metadata (genres, cast, ratings)

### Smart Caching
- Redis caching for improved performance
- Background data updates
- Optimized API usage

## 🚀 Deployment

The app is configured for deployment on Vercel:

1. **Connect your GitHub repository to Vercel**
2. **Set environment variables in Vercel dashboard**
3. **Deploy automatically on push to main branch**

Required environment variables for production:
- All the same variables from `.env.local`
- Ensure database is accessible from Vercel
- Configure email templates in Brevo

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [TMDB](https://www.themoviedb.org/) for movie data
- [Supabase](https://supabase.com/) for backend infrastructure
- [Next.js](https://nextjs.org/) for the amazing framework
- [Tailwind CSS](https://tailwindcss.com/) for styling