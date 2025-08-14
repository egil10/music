# Your Spotify Journey - Complete Music Analytics Dashboard

A comprehensive, mobile-optimized Spotify Wrapped-style dashboard that analyzes your complete Spotify listening history from 2015-2025.

## 🚀 Features

### Core Analytics
- **Complete Music Stats**: Total hours, plays, years of data, and averages
- **Interactive Year Selector**: Filter data by specific years with touch-friendly buttons
- **Listening Patterns**: Hourly, daily, weekly, and monthly trends
- **Top Artists & Tracks**: All-time favorites with detailed statistics

### Advanced Features
- **Mood Radar Chart**: Audio feature analysis (valence, energy, danceability, etc.)
- **Genre Breakdown**: Pie chart showing your musical taste diversity
- **Device Usage**: Donut chart of listening across different platforms
- **Podcast vs Music Split**: Analysis of your content preferences
- **Binge Sessions**: Longest listening marathons with timestamps
- **Daily Heatmap**: Visual representation of listening patterns
- **Artist Carousel**: Swipeable carousel of top artists with images

### Interactive Features
- **Music Library Explorer**: Search through your entire music library
- **Year-over-Year Comparison**: Track how your taste has evolved
- **Valence Trends**: Mood analysis over time
- **Dark Mode Toggle**: Switch between light and dark themes
- **Share Functionality**: Share your stats or export playlists

### Mobile Optimizations
- **Responsive Design**: Optimized for all screen sizes
- **Touch-Friendly**: 48px minimum touch targets
- **Hamburger Menu**: Mobile navigation with smooth animations
- **Swipe Gestures**: Carousel navigation and touch interactions
- **Performance Optimized**: Lazy loading and efficient data handling

## 📱 Mobile Testing Guide

### Testing Tools
1. **Chrome DevTools**: 
   - Press F12 → Click device icon
   - Test iPhone (375px), iPad (768px), Android (360px)
   - Enable touch simulation

2. **Real Device Testing**:
   - Test on actual iPhone/Android devices
   - Check touch responsiveness
   - Verify swipe gestures work

### Mobile Test Checklist
- [ ] **No Horizontal Scroll**: Content fits within viewport
- [ ] **Touch Targets**: All buttons ≥48px tall
- [ ] **Loading Speed**: Dashboard loads in <3 seconds
- [ ] **Swipe Gestures**: Carousel navigation works
- [ ] **Hamburger Menu**: Opens/closes smoothly
- [ ] **Dark Mode**: Toggle works on mobile
- [ ] **Search**: Keyboard appears and functions correctly
- [ ] **Charts**: Responsive and readable on small screens
- [ ] **Performance**: Smooth scrolling and animations

### Performance Metrics
- **First Contentful Paint**: <2s
- **Largest Contentful Paint**: <3s
- **Cumulative Layout Shift**: <0.1
- **First Input Delay**: <100ms

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 16+ 
- Your Spotify data export (from https://www.spotify.com/account/privacy/)

### Installation
```bash
# Clone the repository
git clone https://github.com/egil10/music.git
cd music

# Install dependencies
npm install

# Add your Spotify data
# Place your merged_spotify_data.json file in the raw/ directory

# Build the data files
npm run build:data

# The site is now ready to deploy to GitHub Pages
```

### Data Processing
The build script processes your raw Spotify data and generates optimized JSON files:
- Filters out outliers and invalid entries
- Calculates advanced analytics (binge sessions, device usage, etc.)
- Creates searchable track database
- Generates mobile-optimized data structures

## 📊 Data Files Generated

- `summary.json` - Overview statistics
- `listening_by_year.json` - Yearly breakdown
- `listening_by_month.json` - Monthly trends
- `listening_by_hour.json` - Hourly patterns
- `listening_by_day_of_week.json` - Weekly patterns
- `top_artists_all_time.json` - All-time favorite artists
- `top_tracks_all_time.json` - All-time favorite tracks
- `genre_breakdown.json` - Genre analysis
- `device_usage.json` - Device statistics
- `binge_sessions.json` - Longest listening sessions
- `library_data.json` - Searchable track database

## 🎨 Design Features

### Mobile-First Design
- CSS Grid with responsive breakpoints
- Flexbox layouts for dynamic content
- CSS custom properties for theming
- Smooth animations and transitions

### Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation support
- High contrast ratios
- Screen reader compatibility

### Performance
- Lazy loading for charts and images
- Optimized data structures
- Efficient DOM manipulation
- Minimal external dependencies

## 🌐 Deployment

### GitHub Pages
1. Push your code to GitHub
2. Enable GitHub Pages in repository settings
3. Set source to `/docs` branch
4. Your site will be available at `https://username.github.io/repository-name`

### Custom Domain
1. Add your domain to GitHub Pages settings
2. Create CNAME file in `/docs` directory
3. Configure DNS records

## 🔧 Customization

### Colors & Themes
Edit CSS custom properties in `:root`:
```css
:root {
  --spotify-green: #1DB954;
  --spotify-dark: #121212;
  --spotify-light: #282828;
  /* ... more variables */
}
```

### Adding New Charts
1. Add chart container to HTML
2. Create chart function in JavaScript
3. Call function in `loadDashboard()`
4. Add responsive CSS styles

### Data Processing
Modify `scripts/build-spotify-simple.js` to:
- Add new analytics calculations
- Filter data differently
- Generate additional output files

## 📈 Analytics & Insights

The dashboard provides comprehensive insights into your listening habits:

### Time-based Analysis
- Peak listening hours and days
- Seasonal trends and patterns
- Year-over-year growth

### Content Analysis
- Genre preferences and evolution
- Artist discovery patterns
- Track popularity over time

### Behavioral Insights
- Device usage patterns
- Binge listening sessions
- Podcast vs music preferences

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on mobile devices
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Spotify for providing comprehensive data exports
- Chart.js for beautiful, responsive charts
- Swiper.js for mobile carousel functionality
- GSAP for smooth animations
- The open-source community for inspiration and tools

---

**Note**: This dashboard processes your personal Spotify data locally. No data is sent to external servers, ensuring your privacy is maintained.