# Card Sizing Prototypes

This folder contains card sizing experiments and prototypes for testing different movie card layouts and dimensions.

## Contents

- `test-cards/page.tsx` - Comprehensive card sizing test page (previously at `/test-cards`)

## Card Variants Tested

### A. Current Size (Baseline)
- Original 3:4 aspect ratio
- Full padding and text sizes
- Complete button layout

### B. Compact Card
- 2:3 aspect ratio (~25% shorter)
- Reduced padding and smaller text
- Streamlined button layout

### C. Fixed Height Card
- Capped poster height (192px)
- ~50% shorter than current cards
- Maintains aspect ratio

### D. Ultra-Compact Card
- Very small poster (128px)
- ~66% shorter than current cards
- Maximum cards per screen

### E. Horizontal Card
- Fixed height layout (128px)
- Poster on left, content on right
- Alternative layout approach

### F. FAB Card with Vertical Poster ⭐
- Netflix-style FAB functionality
- Traditional 3:4 vertical poster
- Golden Netflix-style interactions
- Top-right FAB button positioning

## Features

- **Grid Density Controls**: Test 2-6 columns
- **Interactive Follow Buttons**: All functionality works
- **Size Comparison Dashboard**: Visual metrics
- **Responsive Design**: Works on all screen sizes
- **Real Movie Data**: Uses actual TMDB poster images

## Key Findings

- **Fixed Height** cards provide excellent balance of size reduction and readability
- **Ultra-Compact** cards maximize screen real estate
- **FAB approach** provides premium Netflix-like user experience
- **6-column grid** provides optimal card proportions (225px width, ~475px height)

## Status

Preserved for future reference and implementation decisions. All card variants are fully functional and ready for integration.

## Usage

To view these prototypes, the page was previously available at `/test-cards` but has been moved here for archival.