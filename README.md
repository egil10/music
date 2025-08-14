# 🎵 My Spotify Wrapped Dashboard

A beautiful, interactive dashboard that creates your own personalized Spotify Wrapped experience using your exported Spotify data. This project provides a comprehensive analysis of your listening habits, top artists, favorite tracks, and more!

## ✨ Features

- **📊 Interactive Dashboard**: Modern, responsive design with smooth animations
- **🎨 Beautiful Visualizations**: Charts and graphs powered by Chart.js
- **📈 Comprehensive Analytics**: 
  - Total streams and listening time
  - Top artists and tracks
  - Listening habits by hour and day
  - Monthly activity trends
  - Playlist analysis
- **🔒 Privacy-First**: Built-in tools to identify and remove sensitive data
- **📱 Mobile Responsive**: Works perfectly on all devices
- **🚀 GitHub Pages Ready**: Easy deployment to GitHub Pages

## 🛠️ Project Structure

```
music/
├── index.html                 # Main dashboard page
├── css/
│   └── style.css             # Modern, Spotify-inspired styling
├── js/
│   ├── data-processor.js     # Data loading and processing
│   ├── charts.js             # Chart.js visualizations
│   └── app.js                # Main application logic
├── scripts/
│   ├── merge_data.py         # Merge all Spotify data files
│   ├── privacy_filter.py     # Identify sensitive data
│   └── sanitize_data.py      # Remove sensitive information
├── Spotify Account Data/      # Your exported Spotify data
├── Spotify Extended Streaming History/
└── README.md
```

## 🚀 Quick Start

### 1. Export Your Spotify Data

1. Go to [Spotify Privacy Settings](https://www.spotify.com/account/privacy/)
2. Scroll down to "Download your data"
3. Request your data export
4. Wait for the email (usually takes a few days)
5. Download and extract the ZIP file

### 2. Set Up the Project

1. Clone this repository:
   ```bash
   git clone <your-repo-url>
   cd music
   ```

2. Place your exported Spotify data folders in the project root:
   - `Spotify Account Data/`
   - `Spotify Extended Streaming History/`

### 3. Process Your Data (Privacy First!)

Before publishing to GitHub, it's crucial to check for sensitive data:

```bash
# 1. Analyze your data for privacy concerns
python scripts/privacy_filter.py

# 2. Create sanitized versions of your data
python scripts/sanitize_data.py

# 3. Merge all data files (optional)
python scripts/merge_data.py
```

### 4. Deploy to GitHub Pages

1. Push your code to GitHub
2. Go to your repository settings
3. Enable GitHub Pages (Source: main branch)
4. Your dashboard will be available at `https://yourusername.github.io/your-repo-name`

## 🔒 Privacy & Security

### What Data is Safe to Publish?

✅ **Safe to include:**
- Track names, artist names, album names
- Playlist names and descriptions
- Listening timestamps and duration
- Number of streams and followers

❌ **Never publish:**
- IP addresses
- Email addresses
- Device IDs
- Location data
- Payment information
- Technical log files

### Privacy Tools Included

This project includes three Python scripts to help protect your privacy:

1. **`privacy_filter.py`**: Scans your data and identifies potentially sensitive information
2. **`sanitize_data.py`**: Creates clean, safe versions of your data files
3. **`merge_data.py`**: Combines multiple data files into a single file

### Recommended Workflow

```bash
# Step 1: Check what sensitive data exists
python scripts/privacy_filter.py

# Step 2: Create safe versions
python scripts/sanitize_data.py --output-dir safe_data

# Step 3: Review the sanitization report
cat safe_data/sanitization_report.json

# Step 4: Use the safe data for your dashboard
# Copy safe_data/safe_streaming_history.json to your project
```

## 🎨 Customization

### Styling

The dashboard uses a modern, Spotify-inspired design. You can customize the colors in `css/style.css`:

```css
:root {
  --spotify-green: #1db954;
  --spotify-black: #191414;
  --accent-color: #1ed760;
}
```

### Adding New Features

The modular JavaScript structure makes it easy to add new features:

1. **New Data Processing**: Add methods to `SpotifyDataProcessor` class
2. **New Charts**: Add chart methods to `SpotifyCharts` class
3. **New UI Sections**: Add HTML sections and update `SpotifyWrappedApp`

## 📊 Data Analysis Features

### Overview Dashboard
- Total streams and listening time
- Unique artists and tracks
- Monthly listening activity chart

### Top Artists & Tracks
- Most streamed artists with play counts
- Favorite tracks with listening time
- Interactive rankings

### Listening Habits
- Hourly listening patterns
- Day-of-week preferences
- Visual charts for easy understanding

### Playlists
- Your created playlists
- Follower counts and track counts
- Playlist descriptions

## 🛠️ Technical Details

### Technologies Used
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **JavaScript (ES6+)**: Modern JavaScript with classes and async/await
- **Chart.js**: Beautiful, responsive charts
- **Python**: Data processing and privacy tools

### Browser Support
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### Performance
- Lazy loading of data files
- Efficient data processing
- Optimized chart rendering
- Mobile-first responsive design

## 🤝 Contributing

Contributions are welcome! Here are some ideas:

- Add new chart types
- Improve data processing algorithms
- Add more privacy features
- Enhance mobile experience
- Add export functionality
- Create themes/skins

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Spotify for providing the data export feature
- Chart.js for the beautiful charting library
- The open source community for inspiration and tools

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/your-repo-name/issues) page
2. Review the privacy analysis report
3. Make sure your data files are in the correct format

## 🔄 Updates

To update your dashboard with new data:

1. Export fresh data from Spotify
2. Run the privacy scripts again
3. Replace the old data files
4. Deploy the updated dashboard

---

**Enjoy your personalized Spotify Wrapped experience! 🎵**

*Remember: Always prioritize your privacy when sharing data online.*