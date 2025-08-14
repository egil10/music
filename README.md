# 🎵 Spotify Wrapped Advanced

A beautiful, interactive dashboard for analyzing your Spotify listening data with advanced analytics and visualizations.

## ✨ Features

- **📊 Interactive Charts**: Beautiful visualizations using Chart.js
- **📈 Multiple Analytics**: Yearly trends, top artists/tracks, daily patterns
- **🎨 Modern UI**: Responsive design with gradient backgrounds and glassmorphism
- **⚡ Fast Loading**: Optimized data processing with small, web-ready files
- **🔒 Privacy First**: Large data files kept local, only processed results shared

## 🚀 Quick Start

### 1. Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd music

# Install dependencies
npm install
```

### 2. Add Your Spotify Data

Place your large Spotify data files in the `raw/` directory:

```
raw/
├── merged_spotify_data.json     # Your merged streaming history
└── privacy_analysis_report.json # (optional) Privacy analysis
```

**Note**: The `raw/` directory is gitignored to keep large files out of version control.

### 3. Process Your Data

```bash
# Generate small, web-ready data files
npm run build:data
```

This creates optimized files in `public/data/`:
- `summary.json` - Overall statistics
- `listening_by_year.json` - Yearly listening data
- `top_artists_by_year.json` - Top artists per year
- `top_tracks_by_year.json` - Top tracks per year
- `listening_daily.csv` - Daily listening patterns

### 4. View Your Dashboard

Open `public/index.html` in your browser to see your personalized Spotify Wrapped!

## 📊 Dashboard Features

### Overview Stats
- Total listening hours
- Total number of plays
- Years of data available
- Average minutes per play

### Interactive Charts
- **Hours by Year**: See your listening trends over time
- **Top Artists**: Discover your most-listened artists by year
- **Top Tracks**: Find your favorite songs by year
- **Daily Pattern**: Visualize your listening habits over the last 30 days

### Responsive Design
- Works on desktop, tablet, and mobile
- Beautiful gradient backgrounds
- Glassmorphism UI elements
- Smooth animations and transitions

## 🛠️ Technical Details

### Data Processing
- **Input**: Large JSON files (28MB+ merged data)
- **Output**: Small, optimized files (<50KB total)
- **Processing**: 34,192+ streaming history items
- **Performance**: Fast loading with minimal bandwidth usage

### Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js for beautiful visualizations
- **Data Processing**: Node.js with streaming JSON parser
- **Styling**: Modern CSS with gradients and glassmorphism

### File Structure
```
├── raw/                          # Large data files (gitignored)
│   ├── merged_spotify_data.json
│   └── privacy_analysis_report.json
├── public/
│   ├── data/                     # Processed data files
│   │   ├── summary.json
│   │   ├── listening_by_year.json
│   │   ├── top_artists_by_year.json
│   │   ├── top_tracks_by_year.json
│   │   └── listening_daily.csv
│   └── index.html               # Dashboard
├── scripts/
│   └── build-spotify-simple.js  # Data processing script
└── package.json
```

## 🔧 Customization

### Adding New Charts
1. Modify `scripts/build-spotify-simple.js` to generate new data
2. Add new chart containers to `public/index.html`
3. Create Chart.js instances for your new visualizations

### Styling
- Edit the CSS in `public/index.html` to customize colors and layout
- The dashboard uses a purple gradient theme that can be easily modified

### Data Sources
The script supports various Spotify data formats:
- `endTime` / `ts` / `eventTime` / `time` for timestamps
- `artistName` / `master_metadata_artist_name` / `artist` for artist names
- `trackName` / `master_metadata_track_name` / `track` for track names
- `msPlayed` / `ms_played` / `durationMs` for play duration

## 🚀 Deployment

### GitHub Pages
1. Push your code to GitHub
2. Enable GitHub Pages in repository settings
3. Set source to `/docs` or `/public` directory

### Netlify/Vercel
1. Connect your GitHub repository
2. Set build command: `npm run build:data`
3. Set publish directory: `public`

### Local Development
```bash
# Start a local server
npx serve public
# or
python -m http.server 8000
```

## 📈 Data Insights

Your dashboard will show:
- **Listening Trends**: How your music taste has evolved over time
- **Artist Discovery**: Which artists you've listened to most each year
- **Track Favorites**: Your most-played songs and their listening hours
- **Daily Patterns**: Your listening habits and consistency

## 🔒 Privacy & Security

- Large data files are kept local and never uploaded
- Only processed, anonymized statistics are shared
- No personal information is exposed in the dashboard
- All processing happens locally on your machine

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with your own data
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

---

**Enjoy exploring your music listening journey! 🎵**