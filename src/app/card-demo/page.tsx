'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, Film, Tv, Plus, Check, Heart, Mic } from 'lucide-react'

// Mock movie data
const mockMovie = {
  id: 1,
  title: "Avatar: Fire and Ash",
  poster_path: "/cf7hE1ifY4UNbS25tGnaTyyDrI2.jpg",
  vote_average: 8.2,
  unifiedDates: {
    usTheatrical: "2025-12-19",
    streaming: "2026-03-15"
  }
}

type FollowType = 'THEATRICAL' | 'STREAMING' | 'BOTH'

const getPosterUrl = (path: string) => `https://image.tmdb.org/t/p/w342${path}`
const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

// 1. Slack-Style Toggle Buttons
function SlackToggleCard({ movie }: { movie: typeof mockMovie }) {
  const [followTheater, setFollowTheater] = useState(false)
  const [followStreaming, setFollowStreaming] = useState(false)

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow relative group">
      <div className="relative aspect-[16/9] bg-muted">
        <Image
          src={getPosterUrl(movie.poster_path)}
          alt={movie.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Toggle buttons */}
        <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            onClick={() => setFollowTheater(!followTheater)}
            className={`flex-1 text-xs ${
              followTheater
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-white/20 text-white hover:bg-white/30'
            } transition-colors`}
          >
            🎬 Theater
          </Button>
          <Button
            size="sm"
            onClick={() => setFollowStreaming(!followStreaming)}
            className={`flex-1 text-xs ${
              followStreaming
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-white/20 text-white hover:bg-white/30'
            } transition-colors`}
          >
            📺 Streaming
          </Button>
        </div>

        {/* Status indicators */}
        <div className="absolute top-2 left-2 flex gap-1">
          {followTheater && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
          {followStreaming && <div className="w-3 h-3 bg-purple-500 rounded-full"></div>}
        </div>

        {/* Movie info - positioned above buttons */}
        <div className="absolute bottom-10 left-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <h3 className="font-medium text-sm mb-1 truncate">{movie.title}</h3>
          <div className="text-xs flex justify-between">
            <span>🎬 Dec 19</span>
            <span>📺 Mar 15</span>
          </div>
        </div>

        <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
          ⭐ {movie.vote_average}
        </div>
      </div>
    </Card>
  )
}

// 2. GitHub-Style Watch Button
function GitHubWatchCard({ movie }: { movie: typeof mockMovie }) {
  const [watchType, setWatchType] = useState<'none' | 'theater' | 'streaming' | 'both'>('none')
  const [showDropdown, setShowDropdown] = useState(false)

  const handleWatchSelect = (type: typeof watchType) => {
    setWatchType(type)
    setShowDropdown(false)
  }

  const getWatchText = () => {
    switch (watchType) {
      case 'theater': return 'Watching Theater'
      case 'streaming': return 'Watching Streaming'
      case 'both': return 'Watching Both'
      default: return 'Watch'
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow relative group">
      <div className="relative aspect-[16/9] bg-muted">
        <Image
          src={getPosterUrl(movie.poster_path)}
          alt={movie.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Watch button with dropdown */}
        <div className="absolute top-3 right-3">
          <div className="relative">
            <Button
              size="sm"
              onClick={() => setShowDropdown(!showDropdown)}
              className={`text-xs px-3 py-1 ${
                watchType !== 'none'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-white/90 text-black hover:bg-white'
              }`}
            >
              {getWatchText()} ▾
            </Button>

            {showDropdown && (
              <div className="absolute top-8 right-0 bg-white rounded-lg shadow-lg border min-w-40 z-10">
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg"
                  onClick={() => handleWatchSelect('theater')}
                >
                  🎬 Theater releases
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                  onClick={() => handleWatchSelect('streaming')}
                >
                  📺 Streaming releases
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                  onClick={() => handleWatchSelect('both')}
                >
                  🎬📺 Both releases
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 last:rounded-b-lg border-t"
                  onClick={() => handleWatchSelect('none')}
                >
                  Stop watching
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <h3 className="font-medium text-sm mb-1 truncate">{movie.title}</h3>
          <div className="text-xs flex justify-between">
            <span>🎬 Dec 19</span>
            <span>📺 Mar 15</span>
          </div>
        </div>

        <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
          ⭐ {movie.vote_average}
        </div>
      </div>
    </Card>
  )
}

// 3. Linear-Style Multi-Select Chips
function LinearChipsCard({ movie }: { movie: typeof mockMovie }) {
  const [selectedChips, setSelectedChips] = useState<string[]>([])

  const toggleChip = (chip: string) => {
    setSelectedChips(prev =>
      prev.includes(chip)
        ? prev.filter(c => c !== chip)
        : [...prev, chip]
    )
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow relative group">
      <div className="relative aspect-[16/9] bg-muted">
        <Image
          src={getPosterUrl(movie.poster_path)}
          alt={movie.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Chips */}
        <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => toggleChip('theater')}
            className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
              selectedChips.includes('theater')
                ? 'bg-blue-600 text-white'
                : 'bg-white/20 text-white border border-white/30'
            }`}
          >
            🎬 Theater Release
          </button>
          <button
            onClick={() => toggleChip('streaming')}
            className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
              selectedChips.includes('streaming')
                ? 'bg-purple-600 text-white'
                : 'bg-white/20 text-white border border-white/30'
            }`}
          >
            📺 Streaming Release
          </button>
        </div>

        <div className="absolute bottom-10 left-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <h3 className="font-medium text-sm mb-1 truncate">{movie.title}</h3>
          <div className="text-xs flex justify-between">
            <span>🎬 Dec 19</span>
            <span>📺 Mar 15</span>
          </div>
        </div>

        <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
          ⭐ {movie.vote_average}
        </div>
      </div>
    </Card>
  )
}

// 4. Notion-Style Checkbox List
function NotionCheckboxCard({ movie }: { movie: typeof mockMovie }) {
  const [theaterChecked, setTheaterChecked] = useState(false)
  const [streamingChecked, setStreamingChecked] = useState(false)

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow relative group">
      <div className="relative aspect-[16/9] bg-muted">
        <Image
          src={getPosterUrl(movie.poster_path)}
          alt={movie.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Checkbox list */}
        <div className="absolute bottom-3 left-3 right-3 space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <label className="flex items-center space-x-2 text-white text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={theaterChecked}
              onChange={(e) => setTheaterChecked(e.target.checked)}
              className="w-3 h-3 rounded accent-blue-600"
            />
            <span>🎬 Follow theater release</span>
          </label>
          <label className="flex items-center space-x-2 text-white text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={streamingChecked}
              onChange={(e) => setStreamingChecked(e.target.checked)}
              className="w-3 h-3 rounded accent-purple-600"
            />
            <span>📺 Follow streaming release</span>
          </label>
        </div>

        <div className="absolute bottom-14 left-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <h3 className="font-medium text-sm mb-1 truncate">{movie.title}</h3>
          <div className="text-xs flex justify-between">
            <span>🎬 Dec 19</span>
            <span>📺 Mar 15</span>
          </div>
        </div>

        <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
          ⭐ {movie.vote_average}
        </div>
      </div>
    </Card>
  )
}

// 5. Figma-Style Action Menu Button
function FigmaActionMenuCard({ movie }: { movie: typeof mockMovie }) {
  const [followType, setFollowType] = useState<'none' | 'theater' | 'streaming' | 'both'>('none')
  const [showMenu, setShowMenu] = useState(false)

  const getButtonText = () => {
    switch (followType) {
      case 'theater': return 'Following Theater'
      case 'streaming': return 'Following Streaming'
      case 'both': return 'Following Both'
      default: return 'Follow'
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow relative group">
      <div className="relative aspect-[16/9] bg-muted">
        <Image
          src={getPosterUrl(movie.poster_path)}
          alt={movie.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Action menu button */}
        <div className="absolute top-3 right-3">
          <div className="relative">
            <Button
              size="sm"
              onClick={() => setShowMenu(!showMenu)}
              className={`text-xs px-3 py-1 ${
                followType !== 'none'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white/90 text-black hover:bg-white'
              }`}
            >
              {getButtonText()} ▾
            </Button>

            {showMenu && (
              <div className="absolute top-8 right-0 bg-white rounded-xl shadow-xl border min-w-44 z-10 py-1">
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 flex items-center gap-2"
                  onClick={() => { setFollowType('theater'); setShowMenu(false) }}
                >
                  🎬 Theater only
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-purple-50 flex items-center gap-2"
                  onClick={() => { setFollowType('streaming'); setShowMenu(false) }}
                >
                  📺 Streaming only
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-green-50 flex items-center gap-2"
                  onClick={() => { setFollowType('both'); setShowMenu(false) }}
                >
                  🎬📺 Both releases
                </button>
                <hr className="my-1" />
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-600"
                  onClick={() => { setFollowType('none'); setShowMenu(false) }}
                >
                  Don't follow
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <h3 className="font-medium text-sm mb-1 truncate">{movie.title}</h3>
          <div className="text-xs flex justify-between">
            <span>🎬 Dec 19</span>
            <span>📺 Mar 15</span>
          </div>
        </div>

        <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
          ⭐ {movie.vote_average}
        </div>
      </div>
    </Card>
  )
}

// 6. Stripe-Style Radio Button Groups
function StripeRadioCard({ movie }: { movie: typeof mockMovie }) {
  const [followType, setFollowType] = useState<'none' | 'theater' | 'streaming' | 'both'>('none')

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow relative group">
      <div className="relative aspect-[16/9] bg-muted">
        <Image
          src={getPosterUrl(movie.poster_path)}
          alt={movie.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Radio buttons */}
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-white/90 rounded-lg p-2 space-y-1">
            {[
              { value: 'none', label: "Don't follow" },
              { value: 'theater', label: '🎬 Theater only' },
              { value: 'streaming', label: '📺 Streaming only' },
              { value: 'both', label: '🎬📺 Both releases' }
            ].map((option) => (
              <label key={option.value} className="flex items-center space-x-2 text-xs cursor-pointer">
                <input
                  type="radio"
                  name="follow"
                  value={option.value}
                  checked={followType === option.value}
                  onChange={(e) => setFollowType(e.target.value as typeof followType)}
                  className="w-3 h-3"
                />
                <span className="text-gray-800">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <h3 className="font-medium text-xs mb-1 truncate">{movie.title}</h3>
          <div className="text-xs flex justify-between">
            <span>🎬 Dec 19</span>
            <span>📺 Mar 15</span>
          </div>
        </div>

        <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
          ⭐ {movie.vote_average}
        </div>
      </div>
    </Card>
  )
}

// 7. Airtable-Style Multi-Select Dropdown
function AirtableDropdownCard({ movie }: { movie: typeof mockMovie }) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

  const toggleOption = (option: string) => {
    setSelectedOptions(prev =>
      prev.includes(option)
        ? prev.filter(o => o !== option)
        : [...prev, option]
    )
  }

  const getButtonText = () => {
    if (selectedOptions.length === 0) return 'Select releases to follow'
    if (selectedOptions.length === 1) return `Following ${selectedOptions[0]}`
    return `Following ${selectedOptions.length} releases`
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow relative group">
      <div className="relative aspect-[16/9] bg-muted">
        <Image
          src={getPosterUrl(movie.poster_path)}
          alt={movie.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Multi-select dropdown */}
        <div className="absolute top-3 right-3">
          <div className="relative">
            <Button
              size="sm"
              onClick={() => setShowDropdown(!showDropdown)}
              className="text-xs px-3 py-1 bg-white/90 text-black hover:bg-white max-w-32 truncate"
            >
              {getButtonText()} ▾
            </Button>

            {showDropdown && (
              <div className="absolute top-8 right-0 bg-white rounded-lg shadow-lg border min-w-48 z-10 p-2">
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedOptions.includes('Theater')}
                      onChange={() => toggleOption('Theater')}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span>🎬 Theater releases</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedOptions.includes('Streaming')}
                      onChange={() => toggleOption('Streaming')}
                      className="w-4 h-4 accent-purple-600"
                    />
                    <span>📺 Streaming releases</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <h3 className="font-medium text-sm mb-1 truncate">{movie.title}</h3>
          <div className="text-xs flex justify-between">
            <span>🎬 Dec 19</span>
            <span>📺 Mar 15</span>
          </div>
        </div>

        <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
          ⭐ {movie.vote_average}
        </div>
      </div>
    </Card>
  )
}

// 8. Vercel-Style Button with Status
function VercelStatusCard({ movie }: { movie: typeof mockMovie }) {
  const [followState, setFollowState] = useState(0) // 0: none, 1: theater, 2: streaming, 3: both

  const handleClick = () => {
    setFollowState(prev => (prev + 1) % 4)
  }

  const getButtonText = () => {
    switch (followState) {
      case 1: return 'Following Theater'
      case 2: return 'Following Streaming'
      case 3: return 'Following Both'
      default: return 'Follow Releases'
    }
  }

  const getButtonStyle = () => {
    switch (followState) {
      case 1: return 'bg-blue-600 text-white hover:bg-blue-700'
      case 2: return 'bg-purple-600 text-white hover:bg-purple-700'
      case 3: return 'bg-green-600 text-white hover:bg-green-700'
      default: return 'bg-white/90 text-black hover:bg-white'
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow relative group">
      <div className="relative aspect-[16/9] bg-muted">
        <Image
          src={getPosterUrl(movie.poster_path)}
          alt={movie.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Status button */}
        <div className="absolute top-3 right-3">
          <Button
            size="sm"
            onClick={handleClick}
            className={`text-xs px-3 py-1 transition-all ${getButtonStyle()}`}
          >
            {getButtonText()}
          </Button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <h3 className="font-medium text-sm mb-1 truncate">{movie.title}</h3>
          <div className="text-xs flex justify-between">
            <span>🎬 Dec 19</span>
            <span>📺 Mar 15</span>
          </div>
          <div className="mt-1 text-xs text-gray-300">
            Click to cycle follow status
          </div>
        </div>

        <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
          ⭐ {movie.vote_average}
        </div>
      </div>
    </Card>
  )
}

// 9. Discord-Style Notification Bell
function DiscordBellCard({ movie }: { movie: typeof mockMovie }) {
  const [notifications, setNotifications] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

  const toggleNotification = (type: string) => {
    setNotifications(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const getBellStyle = () => {
    if (notifications.length === 0) return 'text-white/60'
    return 'text-yellow-400'
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow relative group">
      <div className="relative aspect-[16/9] bg-muted">
        <Image
          src={getPosterUrl(movie.poster_path)}
          alt={movie.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Notification bell */}
        <div className="absolute top-3 right-3">
          <div className="relative">
            <Button
              size="sm"
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-8 h-8 p-0 bg-black/50 hover:bg-black/70 rounded-full"
            >
              <div className={`text-lg ${getBellStyle()}`}>🔔</div>
              {notifications.length > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                  {notifications.length}
                </div>
              )}
            </Button>

            {showDropdown && (
              <div className="absolute top-9 right-0 bg-gray-800 rounded-lg shadow-lg border border-gray-700 min-w-48 z-10 p-3">
                <div className="text-white text-sm font-medium mb-2">Notification Settings</div>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm cursor-pointer text-gray-300">
                    <input
                      type="checkbox"
                      checked={notifications.includes('theater')}
                      onChange={() => toggleNotification('theater')}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span>🎬 Theater release alerts</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm cursor-pointer text-gray-300">
                    <input
                      type="checkbox"
                      checked={notifications.includes('streaming')}
                      onChange={() => toggleNotification('streaming')}
                      className="w-4 h-4 accent-purple-600"
                    />
                    <span>📺 Streaming release alerts</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <h3 className="font-medium text-sm mb-1 truncate">{movie.title}</h3>
          <div className="text-xs flex justify-between">
            <span>🎬 Dec 19</span>
            <span>📺 Mar 15</span>
          </div>
        </div>

        <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
          ⭐ {movie.vote_average}
        </div>
      </div>
    </Card>
  )
}

// 10. Asana-Style Three Dots Menu
function AsanaMenuCard({ movie }: { movie: typeof mockMovie }) {
  const [followTypes, setFollowTypes] = useState<string[]>([])
  const [showMenu, setShowMenu] = useState(false)

  const handleFollow = (type: string) => {
    setFollowTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
    setShowMenu(false)
  }

  const handleUnfollowAll = () => {
    setFollowTypes([])
    setShowMenu(false)
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow relative group">
      <div className="relative aspect-[16/9] bg-muted">
        <Image
          src={getPosterUrl(movie.poster_path)}
          alt={movie.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Three dots menu */}
        <div className="absolute top-3 right-3">
          <div className="relative">
            <Button
              size="sm"
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 p-0 bg-white/20 hover:bg-white/30 rounded text-white"
            >
              ⋯
            </Button>

            {showMenu && (
              <div className="absolute top-8 right-0 bg-white rounded-lg shadow-lg border min-w-44 z-10 py-1">
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center gap-2"
                  onClick={() => handleFollow('theater')}
                >
                  {followTypes.includes('theater') ? '✓' : '+'} 🎬 Follow theater release
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-purple-50 flex items-center gap-2"
                  onClick={() => handleFollow('streaming')}
                >
                  {followTypes.includes('streaming') ? '✓' : '+'} 📺 Follow streaming release
                </button>
                {followTypes.length > 0 && (
                  <>
                    <hr className="my-1" />
                    <button
                      className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600"
                      onClick={handleUnfollowAll}
                    >
                      Unfollow all
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status indicators */}
        {followTypes.length > 0 && (
          <div className="absolute top-3 left-3 flex gap-1">
            {followTypes.includes('theater') && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
            {followTypes.includes('streaming') && <div className="w-3 h-3 bg-purple-500 rounded-full"></div>}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <h3 className="font-medium text-sm mb-1 truncate">{movie.title}</h3>
          <div className="text-xs flex justify-between">
            <span>🎬 Dec 19</span>
            <span>📺 Mar 15</span>
          </div>
        </div>

        <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
          ⭐ {movie.vote_average}
        </div>
      </div>
    </Card>
  )
}

// 11. Netflix-Style Tab Interface
function NetflixTabCard({ movie }: { movie: typeof mockMovie }) {
  const [followTypes, setFollowTypes] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'theater' | 'streaming'>('theater')

  const toggleFollow = (type: string) => {
    setFollowTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const isFollowing = (type: string) => followTypes.includes(type)

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow relative group">
      <div className="relative aspect-[16/9] bg-muted">
        <Image
          src={getPosterUrl(movie.poster_path)}
          alt={movie.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Tab interface */}
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Tab headers */}
          <div className="flex mb-2">
            <button
              onClick={() => setActiveTab('theater')}
              className={`flex-1 px-3 py-1 text-xs font-medium rounded-t-lg transition-colors ${
                activeTab === 'theater'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              🎬 Theater
            </button>
            <button
              onClick={() => setActiveTab('streaming')}
              className={`flex-1 px-3 py-1 text-xs font-medium rounded-t-lg transition-colors ${
                activeTab === 'streaming'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              📺 Streaming
            </button>
          </div>

          {/* Tab content */}
          <div className="bg-white/90 rounded-b-lg rounded-tr-lg p-2">
            {activeTab === 'theater' ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-800">Theater release: Dec 19, 2025</span>
                <button
                  onClick={() => toggleFollow('theater')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    isFollowing('theater')
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {isFollowing('theater') ? '✓ Following' : 'Follow'}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-800">Streaming: Mar 15, 2026</span>
                <button
                  onClick={() => toggleFollow('streaming')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    isFollowing('streaming')
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {isFollowing('streaming') ? '✓ Following' : 'Follow'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status indicators */}
        <div className="absolute top-2 left-2 flex gap-1">
          {isFollowing('theater') && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
          {isFollowing('streaming') && <div className="w-3 h-3 bg-purple-500 rounded-full"></div>}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <h3 className="font-medium text-xs truncate">{movie.title}</h3>
        </div>

        <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
          ⭐ {movie.vote_average}
        </div>
      </div>
    </Card>
  )
}

// 2. Netflix-Style FAB Card - Netflix aesthetic with FAB functionality
function NetflixFABCard({ movie }: { movie: typeof mockMovie }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [followTypes, setFollowTypes] = useState<FollowType[]>([])

  const toggleFollow = (type: FollowType) => {
    setFollowTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const getMainButtonContent = () => {
    if (followTypes.length === 2) {
      return <Check className="h-5 w-5" />
    } else if (followTypes.length === 1) {
      return followTypes.includes('THEATRICAL') ? '🎬' : '📺'
    } else {
      return <Plus className="h-5 w-5" />
    }
  }

  const getMainButtonColor = () => {
    if (followTypes.length === 2) {
      return 'bg-green-600 hover:bg-green-700'
    } else if (followTypes.includes('THEATRICAL')) {
      return 'bg-yellow-500 hover:bg-yellow-600' // Netflix gold for theater
    } else if (followTypes.includes('STREAMING')) {
      return 'bg-yellow-500 hover:bg-yellow-600' // Netflix gold for streaming
    } else {
      return 'bg-yellow-500 hover:bg-yellow-600' // Netflix gold default
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all relative group bg-black">
      <div className="relative aspect-[16/9] bg-black">
        <Image
          src={getPosterUrl(movie.poster_path)}
          alt={movie.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        {/* Netflix-style gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* FAB */}
        <div className="absolute bottom-4 right-4 z-10">
          {/* Expanded options */}
          {isExpanded && (
            <div className="absolute bottom-16 right-0 space-y-3 animate-in slide-in-from-bottom">
              <div className="flex items-center gap-3">
                <span className="text-white text-sm bg-black/80 px-3 py-1 rounded-full whitespace-nowrap font-medium">
                  Theater Release
                </span>
                <Button
                  size="sm"
                  onClick={() => toggleFollow('THEATRICAL')}
                  className={`w-12 h-12 rounded-full p-0 shadow-xl border-2 border-white/20 ${
                    followTypes.includes('THEATRICAL')
                      ? 'bg-yellow-500 hover:bg-yellow-600'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  {followTypes.includes('THEATRICAL') ? <Check className="h-5 w-5" /> : '🎬'}
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white text-sm bg-black/80 px-3 py-1 rounded-full whitespace-nowrap font-medium">
                  Streaming Release
                </span>
                <Button
                  size="sm"
                  onClick={() => toggleFollow('STREAMING')}
                  className={`w-12 h-12 rounded-full p-0 shadow-xl border-2 border-white/20 ${
                    followTypes.includes('STREAMING')
                      ? 'bg-yellow-500 hover:bg-yellow-600'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  {followTypes.includes('STREAMING') ? <Check className="h-5 w-5" /> : '📺'}
                </Button>
              </div>
            </div>
          )}

          {/* Main FAB button */}
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-14 h-14 rounded-full p-0 text-white shadow-xl border-2 border-white/20 transition-all hover:scale-110 ${getMainButtonColor()}`}
          >
            {isExpanded ? '✕' : getMainButtonContent()}
          </Button>

          {/* Follow hint on hover */}
          {!isExpanded && (
            <div className="absolute bottom-16 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black/90 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap border border-white/20">
                Follow movie releases
              </div>
            </div>
          )}
        </div>

        {/* Netflix-style title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="font-bold text-lg mb-1">{movie.title}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-300">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              ⭐ {movie.vote_average}
            </span>
            <span>🎬 Dec 19</span>
            <span>📺 Mar 15</span>
          </div>
        </div>

        {/* Follow status badge */}
        {followTypes.length > 0 && (
          <div className="absolute top-4 left-4 bg-yellow-500 text-black text-xs px-3 py-1 rounded-full font-medium">
            {followTypes.length === 2 ? 'Following Both' :
             followTypes.includes('THEATRICAL') ? 'Following Theater' :
             'Following Streaming'}
          </div>
        )}
      </div>
    </Card>
  )
}

// 3. Expandable Follow Button Card - Compact with expandable options
function CompactCard() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [followState, setFollowState] = useState<'none' | 'theater' | 'streaming' | 'both'>('none')

  const handleFollowClick = (type: 'theater' | 'streaming' | 'both') => {
    setFollowState(type)
    setIsExpanded(false)
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
      <div className="relative aspect-[4/5] bg-muted">
        <Image
          src={getPosterUrl(mockMovie.poster_path)}
          alt={mockMovie.title}
          fill
          className="object-cover"
        />
        <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded flex items-center space-x-1">
          <Star className="h-2.5 w-2.5 fill-current text-yellow-400" />
          <span className="text-xs">{mockMovie.vote_average}</span>
        </div>
      </div>

      <CardContent className="p-2 flex-grow">
        <h3 className="font-medium text-sm mb-1 truncate">
          {mockMovie.title}
        </h3>

        <div className="space-y-0.5 text-xs">
          <div className="flex items-center">
            <Film className="h-2.5 w-2.5 mr-1 text-yellow-500" />
            <span>{formatDate(mockMovie.unifiedDates.usTheatrical)}</span>
          </div>
          <div className="flex items-center">
            <Tv className="h-2.5 w-2.5 mr-1 text-amber-500" />
            <span>{formatDate(mockMovie.unifiedDates.streaming)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-2 pt-0">
        <div className="w-full space-y-1">
          <div className="grid grid-cols-2 gap-1">
            <Button size="sm" variant="outline" className="text-xs h-6">
              Details
            </Button>

            {!isExpanded ? (
              <Button
                size="sm"
                variant="ghost"
                className={`text-xs h-6 ${
                  followState === 'none' ? 'bg-yellow-500 text-black' :
                  followState === 'theater' ? 'bg-blue-500 text-white' :
                  followState === 'streaming' ? 'bg-purple-500 text-white' :
                  'bg-green-500 text-white'
                }`}
                onClick={() => setIsExpanded(true)}
              >
                {followState === 'none' ? 'Follow' :
                 followState === 'theater' ? '🎬 Theater' :
                 followState === 'streaming' ? '📺 Stream' :
                 '🎬📺 Both'}
              </Button>
            ) : null}
          </div>

          {isExpanded && (
            <div className="grid grid-cols-3 gap-1 animate-in slide-in-from-top duration-200">
              <Button
                size="sm"
                variant="ghost"
                className="bg-blue-500 text-white text-xs h-6"
                onClick={() => handleFollowClick('theater')}
              >
                🎬
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="bg-purple-500 text-white text-xs h-6"
                onClick={() => handleFollowClick('streaming')}
              >
                📺
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="bg-green-500 text-white text-xs h-6"
                onClick={() => handleFollowClick('both')}
              >
                Both
              </Button>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

// 4. Swipe Card - Tinder-style swipe for follow types
function SwipeCard() {
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [followState, setFollowState] = useState<'none' | 'theater' | 'streaming' | 'both'>('none')
  const [isAnimating, setIsAnimating] = useState(false)

  const handleSwipe = (direction: 'left' | 'right') => {
    setSwipeDirection(direction)
    setIsAnimating(true)

    setTimeout(() => {
      if (direction === 'left') {
        setFollowState(prev => prev === 'theater' ? 'none' : 'theater')
      } else {
        setFollowState(prev => prev === 'streaming' ? 'none' : 'streaming')
      }
      setSwipeDirection(null)
      setIsAnimating(false)
    }, 300)
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow relative group">
      <div className={`relative aspect-[3/4] bg-muted transition-transform duration-300 ${
        swipeDirection === 'left' ? '-translate-x-4 rotate-6' :
        swipeDirection === 'right' ? 'translate-x-4 -rotate-6' : ''
      }`}>
        <Image
          src={getPosterUrl(mockMovie.poster_path)}
          alt={mockMovie.title}
          fill
          className="object-cover"
        />

        {/* Swipe indicators */}
        <div className="absolute inset-0 flex">
          <div
            className="flex-1 bg-blue-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={() => !isAnimating && handleSwipe('left')}
          >
            <div className="text-white text-2xl">🎬</div>
          </div>
          <div
            className="flex-1 bg-purple-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={() => !isAnimating && handleSwipe('right')}
          >
            <div className="text-white text-2xl">📺</div>
          </div>
        </div>

        {/* Status indicator */}
        <div className="absolute top-2 left-2 right-2 flex justify-between">
          <div className={`w-4 h-4 rounded-full ${followState === 'theater' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
          <div className={`w-4 h-4 rounded-full ${followState === 'streaming' ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
        </div>

        <div className="absolute bottom-2 left-2 right-2 text-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="font-medium">{mockMovie.title}</p>
          <p>Swipe left for theater, right for streaming</p>
        </div>
      </div>
    </Card>
  )
}

// 5. Floating Action Button (FAB) Card - Clear follow indication
function FABCard() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [followTypes, setFollowTypes] = useState<FollowType[]>([])

  const toggleFollow = (type: FollowType) => {
    setFollowTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const getMainButtonContent = () => {
    if (followTypes.length === 2) {
      return <Check className="h-5 w-5" />
    } else if (followTypes.length === 1) {
      return followTypes.includes('THEATRICAL') ? '🎬' : '📺'
    } else {
      return <Plus className="h-5 w-5" />
    }
  }

  const getMainButtonColor = () => {
    if (followTypes.length === 2) {
      return 'bg-green-500 hover:bg-green-600'
    } else if (followTypes.includes('THEATRICAL')) {
      return 'bg-blue-500 hover:bg-blue-600'
    } else if (followTypes.includes('STREAMING')) {
      return 'bg-purple-500 hover:bg-purple-600'
    } else {
      return 'bg-yellow-500 hover:bg-yellow-600'
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow relative group">
      <div className="relative aspect-[3/4] bg-muted">
        <Image
          src={getPosterUrl(mockMovie.poster_path)}
          alt={mockMovie.title}
          fill
          className="object-cover"
        />

        {/* FAB */}
        <div className="absolute bottom-4 right-4">
          {/* Expanded options */}
          {isExpanded && (
            <div className="absolute bottom-16 right-0 space-y-2 animate-in slide-in-from-bottom">
              <div className="flex items-center gap-2">
                <span className="text-white text-xs bg-black/70 px-2 py-1 rounded whitespace-nowrap">Theater</span>
                <Button
                  size="sm"
                  onClick={() => toggleFollow('THEATRICAL')}
                  className={`w-10 h-10 rounded-full p-0 shadow-lg ${
                    followTypes.includes('THEATRICAL') ? 'bg-blue-600' : 'bg-blue-500'
                  }`}
                >
                  {followTypes.includes('THEATRICAL') ? <Check className="h-4 w-4" /> : '🎬'}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white text-xs bg-black/70 px-2 py-1 rounded whitespace-nowrap">Streaming</span>
                <Button
                  size="sm"
                  onClick={() => toggleFollow('STREAMING')}
                  className={`w-10 h-10 rounded-full p-0 shadow-lg ${
                    followTypes.includes('STREAMING') ? 'bg-purple-600' : 'bg-purple-500'
                  }`}
                >
                  {followTypes.includes('STREAMING') ? <Check className="h-4 w-4" /> : '📺'}
                </Button>
              </div>
            </div>
          )}

          {/* Main FAB button */}
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-12 h-12 rounded-full p-0 text-white shadow-lg transition-all hover:scale-110 ${getMainButtonColor()}`}
          >
            {isExpanded ? '✕' : getMainButtonContent()}
          </Button>

          {/* Follow hint on hover */}
          {!isExpanded && (
            <div className="absolute bottom-14 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                Follow movie
              </div>
            </div>
          )}
        </div>

        <div className="absolute top-2 left-2 text-white text-xs bg-black/70 px-2 py-1 rounded">
          {mockMovie.title}
        </div>

        {/* Follow status badge */}
        {followTypes.length > 0 && (
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {followTypes.length === 2 ? 'Following both' :
             followTypes.includes('THEATRICAL') ? 'Following theater' :
             'Following streaming'}
          </div>
        )}
      </div>
    </Card>
  )
}

// 6. Progress Ring Card - Circular progress on long press
function ProgressRingCard() {
  const [progress, setProgress] = useState(0)
  const [followState, setFollowState] = useState<'none' | 'theater' | 'streaming'>('none')
  const [activeType, setActiveType] = useState<'theater' | 'streaming' | null>(null)
  const progressTimer = useRef<NodeJS.Timeout | null>(null)

  const startProgress = (type: 'theater' | 'streaming') => {
    if (followState === type) return
    setActiveType(type)
    setProgress(0)

    progressTimer.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setFollowState(type)
          setActiveType(null)
          if (progressTimer.current) clearInterval(progressTimer.current)
          return 0
        }
        return prev + 2
      })
    }, 20)
  }

  const stopProgress = () => {
    setProgress(0)
    setActiveType(null)
    if (progressTimer.current) clearInterval(progressTimer.current)
  }

  const circumference = 2 * Math.PI * 20

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow relative group">
      <div className="relative aspect-[3/4] bg-muted">
        <Image
          src={getPosterUrl(mockMovie.poster_path)}
          alt={mockMovie.title}
          fill
          className="object-cover"
        />

        {/* Progress rings */}
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <div className="relative">
            <svg className="w-10 h-10 transform -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="18"
                stroke="white"
                strokeWidth="2"
                fill="transparent"
                opacity="0.3"
              />
              {activeType === 'theater' && (
                <circle
                  cx="20"
                  cy="20"
                  r="18"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (progress / 100) * circumference}
                  className="transition-all duration-75"
                />
              )}
            </svg>
            <button
              className="absolute inset-0 flex items-center justify-center text-white text-lg"
              onMouseDown={() => startProgress('theater')}
              onMouseUp={stopProgress}
              onMouseLeave={stopProgress}
            >
              {followState === 'theater' ? '✓' : '🎬'}
            </button>
          </div>

          <div className="relative">
            <svg className="w-10 h-10 transform -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="18"
                stroke="white"
                strokeWidth="2"
                fill="transparent"
                opacity="0.3"
              />
              {activeType === 'streaming' && (
                <circle
                  cx="20"
                  cy="20"
                  r="18"
                  stroke="#7c3aed"
                  strokeWidth="3"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (progress / 100) * circumference}
                  className="transition-all duration-75"
                />
              )}
            </svg>
            <button
              className="absolute inset-0 flex items-center justify-center text-white text-lg"
              onMouseDown={() => startProgress('streaming')}
              onMouseUp={stopProgress}
              onMouseLeave={stopProgress}
            >
              {followState === 'streaming' ? '✓' : '📺'}
            </button>
          </div>
        </div>

        <div className="absolute bottom-2 left-2 right-2 text-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="font-medium">{mockMovie.title}</p>
          <p>Hold to follow</p>
        </div>
      </div>
    </Card>
  )
}

// 7. Magnetic Zones Card - Drag to zones
function MagneticZonesCard() {
  const [dragOver, setDragOver] = useState<'theater' | 'streaming' | null>(null)
  const [followTypes, setFollowTypes] = useState<FollowType[]>([])

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', '')
  }

  const handleDragOver = (e: React.DragEvent, zone: 'theater' | 'streaming') => {
    e.preventDefault()
    setDragOver(zone)
  }

  const handleDragLeave = () => {
    setDragOver(null)
  }

  const handleDrop = (e: React.DragEvent, type: FollowType) => {
    e.preventDefault()
    setFollowTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
    setDragOver(null)
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow relative group h-64">
      <div className="relative h-full bg-muted flex">
        {/* Draggable poster */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="w-16 h-20 rounded overflow-hidden cursor-move shadow-lg">
            <Image
              src={getPosterUrl(mockMovie.poster_path)}
              alt={mockMovie.title}
              width={64}
              height={80}
              className="object-cover"
              draggable
              onDragStart={handleDragStart}
            />
          </div>
        </div>

        {/* Theater zone */}
        <div
          className={`flex-1 h-full border-2 border-dashed border-blue-300 flex flex-col items-center justify-center transition-colors ${
            dragOver === 'theater' ? 'bg-blue-100 border-blue-500' :
            followTypes.includes('THEATRICAL') ? 'bg-blue-50 border-blue-400' : ''
          }`}
          onDragOver={(e) => handleDragOver(e, 'theater')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'THEATRICAL')}
        >
          <div className="text-4xl mb-2">🎬</div>
          <p className="text-sm font-medium text-center">Theater</p>
          {followTypes.includes('THEATRICAL') && <div className="text-green-500 mt-1">✓</div>}
        </div>

        {/* Streaming zone */}
        <div
          className={`flex-1 h-full border-2 border-dashed border-purple-300 flex flex-col items-center justify-center transition-colors ${
            dragOver === 'streaming' ? 'bg-purple-100 border-purple-500' :
            followTypes.includes('STREAMING') ? 'bg-purple-50 border-purple-400' : ''
          }`}
          onDragOver={(e) => handleDragOver(e, 'streaming')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'STREAMING')}
        >
          <div className="text-4xl mb-2">📺</div>
          <p className="text-sm font-medium text-center">Streaming</p>
          {followTypes.includes('STREAMING') && <div className="text-green-500 mt-1">✓</div>}
        </div>

        <div className="absolute bottom-2 left-2 right-2 text-center text-sm font-medium">
          {mockMovie.title}
        </div>
      </div>
    </Card>
  )
}

// 8. Flip Card - Card flips to show follow options
function FlipCard() {
  const [isFlipped, setIsFlipped] = useState(false)
  const [followTypes, setFollowTypes] = useState<FollowType[]>([])

  const toggleFollow = (type: FollowType) => {
    setFollowTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  return (
    <div
      className="relative w-full aspect-[3/4] cursor-pointer"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div className={`absolute inset-0 transition-transform duration-700 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        {/* Front */}
        <Card className="absolute inset-0 overflow-hidden backface-hidden">
          <div className="relative w-full h-full bg-muted">
            <Image
              src={getPosterUrl(mockMovie.poster_path)}
              alt={mockMovie.title}
              fill
              className="object-cover"
            />
            <div className="absolute top-2 right-2 text-white text-xs bg-black/70 px-2 py-1 rounded">
              ⭐ {mockMovie.vote_average}
            </div>
            <div className="absolute bottom-2 left-2 right-2 text-white">
              <p className="font-medium text-sm">{mockMovie.title}</p>
              <p className="text-xs opacity-75">Hover to follow</p>
            </div>
            {followTypes.length > 0 && (
              <div className="absolute top-2 left-2 flex gap-1">
                {followTypes.includes('THEATRICAL') && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
                {followTypes.includes('STREAMING') && <div className="w-3 h-3 bg-purple-500 rounded-full"></div>}
              </div>
            )}
          </div>
        </Card>

        {/* Back */}
        <Card className="absolute inset-0 overflow-hidden backface-hidden rotate-y-180 bg-gradient-to-br from-gray-900 to-black text-white">
          <div className="h-full flex flex-col items-center justify-center p-4 space-y-4">
            <h3 className="font-bold text-lg text-center">{mockMovie.title}</h3>
            <div className="space-y-3 w-full">
              <Button
                onClick={() => toggleFollow('THEATRICAL')}
                className={`w-full ${
                  followTypes.includes('THEATRICAL') ? 'bg-blue-600' : 'bg-blue-500'
                } hover:bg-blue-600`}
              >
                {followTypes.includes('THEATRICAL') ? '✓' : '+'} 🎬 Theater
              </Button>
              <Button
                onClick={() => toggleFollow('STREAMING')}
                className={`w-full ${
                  followTypes.includes('STREAMING') ? 'bg-purple-600' : 'bg-purple-500'
                } hover:bg-purple-600`}
              >
                {followTypes.includes('STREAMING') ? '✓' : '+'} 📺 Streaming
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

// 9. Sliding Panels Card - Left/right panels slide in
function SlidingPanelsCard() {
  const [activePanel, setActivePanel] = useState<'left' | 'right' | null>(null)
  const [followTypes, setFollowTypes] = useState<FollowType[]>([])

  const toggleFollow = (type: FollowType) => {
    setFollowTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
    setActivePanel(null)
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow relative group">
      <div className="relative aspect-[3/4] bg-muted">
        <Image
          src={getPosterUrl(mockMovie.poster_path)}
          alt={mockMovie.title}
          fill
          className="object-cover"
        />

        {/* Left panel */}
        <div
          className={`absolute top-0 left-0 bottom-0 bg-blue-500/95 flex flex-col items-center justify-center transition-transform duration-300 ${
            activePanel === 'left' ? 'w-full translate-x-0' : 'w-1/2 -translate-x-full group-hover:translate-x-0'
          }`}
          onClick={() => activePanel === 'left' ? toggleFollow('THEATRICAL') : setActivePanel('left')}
        >
          <div className="text-white text-4xl mb-2">🎬</div>
          <p className="text-white font-medium">Theater</p>
          {followTypes.includes('THEATRICAL') && <div className="text-white mt-2">✓ Following</div>}
        </div>

        {/* Right panel */}
        <div
          className={`absolute top-0 right-0 bottom-0 bg-purple-500/95 flex flex-col items-center justify-center transition-transform duration-300 ${
            activePanel === 'right' ? 'w-full translate-x-0' : 'w-1/2 translate-x-full group-hover:translate-x-0'
          }`}
          onClick={() => activePanel === 'right' ? toggleFollow('STREAMING') : setActivePanel('right')}
        >
          <div className="text-white text-4xl mb-2">📺</div>
          <p className="text-white font-medium">Streaming</p>
          {followTypes.includes('STREAMING') && <div className="text-white mt-2">✓ Following</div>}
        </div>

        <div className="absolute bottom-2 left-2 right-2 text-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="font-medium">{mockMovie.title}</p>
          <p>Hover to reveal panels</p>
        </div>
      </div>
    </Card>
  )
}

// 10. Pulse Animation Card - Poster pulses with follow states
function PulseAnimationCard() {
  const [followTypes, setFollowTypes] = useState<FollowType[]>([])
  const [pulseColor, setPulseColor] = useState('yellow')

  const toggleFollow = (type: FollowType) => {
    setFollowTypes(prev => {
      const newTypes = prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]

      // Update pulse color based on follow state
      if (newTypes.length === 2) {
        setPulseColor('green')
      } else if (newTypes.includes('THEATRICAL')) {
        setPulseColor('blue')
      } else if (newTypes.includes('STREAMING')) {
        setPulseColor('purple')
      } else {
        setPulseColor('yellow')
      }

      return newTypes
    })
  }

  const getPulseClass = () => {
    switch (pulseColor) {
      case 'blue': return 'animate-pulse shadow-lg shadow-blue-500/50'
      case 'purple': return 'animate-pulse shadow-lg shadow-purple-500/50'
      case 'green': return 'animate-pulse shadow-lg shadow-green-500/50'
      default: return 'hover:animate-pulse hover:shadow-lg hover:shadow-yellow-500/50'
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all relative group">
      <div className={`relative aspect-[3/4] bg-muted transition-all duration-300 ${getPulseClass()}`}>
        <Image
          src={getPosterUrl(mockMovie.poster_path)}
          alt={mockMovie.title}
          fill
          className="object-cover"
        />

        {/* Follow buttons */}
        <div className="absolute bottom-4 left-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            onClick={() => toggleFollow('THEATRICAL')}
            className={`flex-1 ${
              followTypes.includes('THEATRICAL') ? 'bg-blue-600' : 'bg-blue-500'
            } hover:bg-blue-600`}
          >
            🎬
          </Button>
          <Button
            onClick={() => toggleFollow('STREAMING')}
            className={`flex-1 ${
              followTypes.includes('STREAMING') ? 'bg-purple-600' : 'bg-purple-500'
            } hover:bg-purple-600`}
          >
            📺
          </Button>
        </div>

        <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
          <div className="text-white text-xs bg-black/70 px-2 py-1 rounded">
            {mockMovie.title}
          </div>
          <div className="text-white text-xs bg-black/70 px-2 py-1 rounded">
            ⭐ {mockMovie.vote_average}
          </div>
        </div>

        {/* Pulse status */}
        <div className="absolute bottom-2 left-2 right-2 text-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
          <p>
            {followTypes.length === 2 ? 'Following both (green pulse)' :
             followTypes.includes('THEATRICAL') ? 'Following theater (blue pulse)' :
             followTypes.includes('STREAMING') ? 'Following streaming (purple pulse)' :
             'Hover to follow (yellow pulse)'}
          </p>
        </div>
      </div>
    </Card>
  )
}

// 11. Corner Fold Card - Page corner fold reveals follow menu
function CornerFoldCard() {
  const [isFolded, setIsFolded] = useState(false)
  const [followTypes, setFollowTypes] = useState<FollowType[]>([])

  const toggleFollow = (type: FollowType) => {
    setFollowTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow relative group">
      <div className="relative aspect-[3/4] bg-muted">
        <Image
          src={getPosterUrl(mockMovie.poster_path)}
          alt={mockMovie.title}
          fill
          className="object-cover"
        />

        {/* Corner fold trigger */}
        <div
          className="absolute top-0 right-0 w-8 h-8 cursor-pointer z-10"
          onMouseEnter={() => setIsFolded(true)}
          onMouseLeave={() => setIsFolded(false)}
        >
          {/* Folded corner */}
          <div className={`absolute top-0 right-0 transition-all duration-300 ${
            isFolded ? 'w-24 h-24' : 'w-8 h-8'
          }`}>
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-yellow-400 to-yellow-500 transform origin-top-right transition-all duration-300"
                 style={{
                   clipPath: 'polygon(100% 0%, 0% 0%, 100% 100%)'
                 }}>
            </div>

            {/* Follow options revealed under fold */}
            {isFolded && (
              <div className="absolute top-4 right-4 space-y-1 animate-in fade-in">
                <Button
                  size="sm"
                  onClick={() => toggleFollow('THEATRICAL')}
                  className={`w-8 h-8 p-0 rounded-full ${
                    followTypes.includes('THEATRICAL') ? 'bg-blue-600' : 'bg-blue-500'
                  }`}
                >
                  🎬
                </Button>
                <Button
                  size="sm"
                  onClick={() => toggleFollow('STREAMING')}
                  className={`w-8 h-8 p-0 rounded-full ${
                    followTypes.includes('STREAMING') ? 'bg-purple-600' : 'bg-purple-500'
                  }`}
                >
                  📺
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Follow status indicators */}
        {followTypes.length > 0 && (
          <div className="absolute top-2 left-2 flex gap-1">
            {followTypes.includes('THEATRICAL') && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
            {followTypes.includes('STREAMING') && <div className="w-3 h-3 bg-purple-500 rounded-full"></div>}
          </div>
        )}

        <div className="absolute bottom-2 left-2 right-2 text-white">
          <p className="font-medium text-sm">{mockMovie.title}</p>
          <p className="text-xs opacity-75">Hover corner to follow</p>
        </div>
      </div>
    </Card>
  )
}

// 12. Shake to Follow Card - Shake animation triggers follow
function ShakeToFollowCard() {
  const [isShaking, setIsShaking] = useState(false)
  const [followState, setFollowState] = useState<'none' | 'theater' | 'streaming' | 'both'>('none')

  const triggerShake = () => {
    setIsShaking(true)
    setTimeout(() => {
      setIsShaking(false)
      // Cycle through follow states
      setFollowState(prev => {
        switch (prev) {
          case 'none': return 'theater'
          case 'theater': return 'streaming'
          case 'streaming': return 'both'
          case 'both': return 'none'
          default: return 'theater'
        }
      })
    }, 600)
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow relative group">
      <div className={`relative aspect-[3/4] bg-muted transition-transform ${
        isShaking ? 'animate-bounce' : ''
      }`}>
        <Image
          src={getPosterUrl(mockMovie.poster_path)}
          alt={mockMovie.title}
          fill
          className="object-cover"
        />

        {/* Shake button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            onClick={triggerShake}
            disabled={isShaking}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 py-3 rounded-full shadow-lg"
          >
            {isShaking ? '🔄' : '🪩'} Shake!
          </Button>
        </div>

        {/* Follow state display */}
        <div className="absolute top-2 left-2 right-2 flex justify-between">
          <div className="text-white text-xs bg-black/70 px-2 py-1 rounded">
            {mockMovie.title}
          </div>
          <div className="flex gap-1">
            {(followState === 'theater' || followState === 'both') &&
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-xs">🎬</div>}
            {(followState === 'streaming' || followState === 'both') &&
              <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center text-xs">📺</div>}
          </div>
        </div>

        <div className="absolute bottom-2 left-2 right-2 text-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
          <p>
            Status: {followState === 'none' ? 'Not following' :
                     followState === 'theater' ? 'Following theater' :
                     followState === 'streaming' ? 'Following streaming' :
                     'Following both'}
          </p>
        </div>
      </div>
    </Card>
  )
}

// 13. Voice Bubble Card - Speech bubble with follow options
function VoiceBubbleCard() {
  const [showBubble, setShowBubble] = useState(false)
  const [followTypes, setFollowTypes] = useState<FollowType[]>([])

  const toggleFollow = (type: FollowType) => {
    setFollowTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
    setShowBubble(false)
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow relative group">
      <div className="relative aspect-[3/4] bg-muted">
        <Image
          src={getPosterUrl(mockMovie.poster_path)}
          alt={mockMovie.title}
          fill
          className="object-cover"
        />

        {/* Speech bubble */}
        {showBubble && (
          <div className="absolute top-4 left-4 right-4 animate-in slide-in-from-top">
            <div className="bg-white rounded-lg p-3 shadow-lg relative">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-800">Follow this movie?</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => toggleFollow('THEATRICAL')}
                    className={`flex-1 text-xs ${
                      followTypes.includes('THEATRICAL') ? 'bg-blue-600' : 'bg-blue-500'
                    }`}
                  >
                    🎬 Theater
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => toggleFollow('STREAMING')}
                    className={`flex-1 text-xs ${
                      followTypes.includes('STREAMING') ? 'bg-purple-600' : 'bg-purple-500'
                    }`}
                  >
                    📺 Stream
                  </Button>
                </div>
              </div>
              {/* Speech bubble tail */}
              <div className="absolute bottom-0 left-6 transform translate-y-full">
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-white"></div>
              </div>
            </div>
          </div>
        )}

        {/* Mic button */}
        <div className="absolute bottom-4 right-4">
          <Button
            onClick={() => setShowBubble(!showBubble)}
            className="w-12 h-12 rounded-full p-0 bg-yellow-500 hover:bg-yellow-600 text-black shadow-lg"
          >
            <Mic className="h-5 w-5" />
          </Button>
        </div>

        {/* Follow indicators */}
        {followTypes.length > 0 && (
          <div className="absolute top-2 right-2 flex gap-1">
            {followTypes.includes('THEATRICAL') && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
            {followTypes.includes('STREAMING') && <div className="w-3 h-3 bg-purple-500 rounded-full"></div>}
          </div>
        )}

        <div className="absolute bottom-2 left-2 text-white">
          <p className="font-medium text-sm">{mockMovie.title}</p>
          <p className="text-xs opacity-75">Click mic to speak</p>
        </div>
      </div>
    </Card>
  )
}

export default function CardDemo() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Movie Card Design Options</h1>

      {/* SaaS-Inspired Follow Options */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-blue-600">SaaS-Inspired Follow Ideas</h2>
        <p className="text-gray-600 mb-6">Clean, professional patterns for following movie releases (theater and streaming). Choose your favorite:</p>

        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-medium mb-4">1. Slack-Style Toggle Buttons</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <SlackToggleCard movie={mockMovie} />
              <SlackToggleCard movie={mockMovie} />
              <SlackToggleCard movie={mockMovie} />
              <SlackToggleCard movie={mockMovie} />
            </div>
            <p className="text-sm text-gray-600 mt-2">Two separate toggle buttons - clean on/off states with visual feedback</p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">2. GitHub-Style Watch Button</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <GitHubWatchCard movie={mockMovie} />
              <GitHubWatchCard movie={mockMovie} />
              <GitHubWatchCard movie={mockMovie} />
              <GitHubWatchCard movie={mockMovie} />
            </div>
            <p className="text-sm text-gray-600 mt-2">Single "Watch" button with dropdown for release types</p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">3. Linear-Style Multi-Select Chips</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <LinearChipsCard movie={mockMovie} />
              <LinearChipsCard movie={mockMovie} />
              <LinearChipsCard movie={mockMovie} />
              <LinearChipsCard movie={mockMovie} />
            </div>
            <p className="text-sm text-gray-600 mt-2">Clickable chips that can be selected/deselected independently</p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">4. Notion-Style Checkbox List</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <NotionCheckboxCard movie={mockMovie} />
              <NotionCheckboxCard movie={mockMovie} />
              <NotionCheckboxCard movie={mockMovie} />
              <NotionCheckboxCard movie={mockMovie} />
            </div>
            <p className="text-sm text-gray-600 mt-2">Clean checkbox interface - simple, clear, familiar pattern</p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">5. Figma-Style Action Menu Button</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <FigmaActionMenuCard movie={mockMovie} />
              <FigmaActionMenuCard movie={mockMovie} />
              <FigmaActionMenuCard movie={mockMovie} />
              <FigmaActionMenuCard movie={mockMovie} />
            </div>
            <p className="text-sm text-gray-600 mt-2">"Follow" button with dropdown menu showing current selection</p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">6. Stripe-Style Radio Button Groups</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <StripeRadioCard movie={mockMovie} />
              <StripeRadioCard movie={mockMovie} />
              <StripeRadioCard movie={mockMovie} />
              <StripeRadioCard movie={mockMovie} />
            </div>
            <p className="text-sm text-gray-600 mt-2">Radio button selection for follow type (don't follow, theater, streaming, both)</p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">7. Airtable-Style Multi-Select Dropdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <AirtableDropdownCard movie={mockMovie} />
              <AirtableDropdownCard movie={mockMovie} />
              <AirtableDropdownCard movie={mockMovie} />
              <AirtableDropdownCard movie={mockMovie} />
            </div>
            <p className="text-sm text-gray-600 mt-2">Single button opens multi-select dropdown with checkboxes</p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">8. Vercel-Style Button with Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <VercelStatusCard movie={mockMovie} />
              <VercelStatusCard movie={mockMovie} />
              <VercelStatusCard movie={mockMovie} />
              <VercelStatusCard movie={mockMovie} />
            </div>
            <p className="text-sm text-gray-600 mt-2">Single button that cycles through clear states with descriptive text</p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">9. Discord-Style Notification Bell</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <DiscordBellCard movie={mockMovie} />
              <DiscordBellCard movie={mockMovie} />
              <DiscordBellCard movie={mockMovie} />
              <DiscordBellCard movie={mockMovie} />
            </div>
            <p className="text-sm text-gray-600 mt-2">Bell icon with notification settings dropdown and badge counter</p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">10. Asana-Style Three Dots Menu</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <AsanaMenuCard movie={mockMovie} />
              <AsanaMenuCard movie={mockMovie} />
              <AsanaMenuCard movie={mockMovie} />
              <AsanaMenuCard movie={mockMovie} />
            </div>
            <p className="text-sm text-gray-600 mt-2">Three dots menu with follow options - clean, professional, space-efficient</p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">11. Netflix-Style Tab Interface</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <NetflixTabCard movie={mockMovie} />
              <NetflixTabCard movie={mockMovie} />
              <NetflixTabCard movie={mockMovie} />
              <NetflixTabCard movie={mockMovie} />
            </div>
            <p className="text-sm text-gray-600 mt-2">Tab interface switching between theater and streaming with inline follow buttons</p>
          </div>
        </div>
      </section>

      {/* Your Selected Cards */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-6 text-green-600">✓ Your Selected Cards</h2>

        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-medium mb-4">Card #1: Netflix-Style FAB</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <NetflixFABCard movie={mockMovie} />
              <NetflixFABCard movie={mockMovie} />
              <NetflixFABCard movie={mockMovie} />
              <NetflixFABCard movie={mockMovie} />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Netflix aesthetic:</strong> Red accent colors, gradient overlays, bold title treatment with FAB functionality
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Card #3: Expandable Follow Button</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <CompactCard />
              <CompactCard />
              <CompactCard />
              <CompactCard />
            </div>
            <p className="text-sm text-gray-600 mt-2">Click follow button to expand Theater/Streaming/Both options</p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Card #5: Improved FAB (Floating Action Button)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <FABCard />
              <FABCard />
              <FABCard />
              <FABCard />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Improvements:</strong> Clear "Follow movie" tooltip, dynamic colors, labeled options, status badge
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}