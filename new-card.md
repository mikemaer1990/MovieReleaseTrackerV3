# Variant 29: Borderless with Shadow Design

This is the clean, modern card design with gradient buttons and shadow effects.

## Code:

```tsx
<div className={cn("rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow h-full flex flex-col bg-zinc-900", className)}>
  <div className="relative w-full aspect-[3/4] bg-muted">
    {posterUrl && <Image src={posterUrl} alt={movie.title} fill className="object-cover" sizes="33vw" />}
    {movie.vote_average > 0 && (
      <div className="absolute top-3 right-3 w-12 h-12 rounded-full bg-black/80 flex flex-col items-center justify-center">
        <span className="text-yellow-400 font-bold text-sm">{movie.vote_average.toFixed(1)}</span>
        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
      </div>
    )}
  </div>
  <div className="p-4 space-y-3 flex-grow flex flex-col">
    <h3 className="font-bold text-base truncate">{movie.title}</h3>
    <div className="text-xs text-muted-foreground">
      <div>🎬 {formatDateWithFallback(unifiedDates?.usTheatrical)}</div>
      <div>📺 {formatDateWithFallback(unifiedDates?.streaming)}</div>
    </div>
    <div className="flex gap-2">
      <button onClick={handleTheatricalToggle} className={cn("flex-1 py-2 rounded-lg text-xs font-semibold transition-all shadow-md", isFollowingTheatrical ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black" : "bg-zinc-800 hover:bg-zinc-700 text-white")}>
        {isFollowingTheatrical ? "✓ Theater" : "+ Theater"}
      </button>
      <button onClick={handleStreamingToggle} className={cn("flex-1 py-2 rounded-lg text-xs font-semibold transition-all shadow-md", isFollowingStreaming ? "bg-gradient-to-br from-amber-400 to-amber-600 text-black" : "bg-zinc-800 hover:bg-zinc-700 text-white")}>
        {isFollowingStreaming ? "✓ Stream" : "+ Stream"}
      </button>
    </div>
    <Link href={`/movie/${movie.id}`} className="py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-primary to-yellow-500 text-black hover:from-primary/90 hover:to-yellow-500/90 transition-all text-center shadow-md mt-auto">
      View Full Details
    </Link>
  </div>
</div>
```

## Key Features:

- **Borderless design** with rounded corners (rounded-xl)
- **Shadow effects** that increase on hover (shadow-lg → shadow-2xl)
- **Rating badge** in top-right corner with circular bg-black/80 background
- **Release dates** displayed with emoji icons (🎬 theater, 📺 streaming)
- **Gradient buttons** for follow actions:
  - Theater: yellow-400 to yellow-600 gradient when active
  - Streaming: amber-400 to amber-600 gradient when active
  - Default: zinc-800 background with hover effect
- **View Details button** with primary to yellow-500 gradient
- **Flexible layout** with space-y-3 and flex-col
- **Modern aesthetic** with clean spacing and shadow-md on buttons
