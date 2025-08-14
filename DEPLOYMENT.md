# 🚀 Deployment Guide

## GitHub Pages Setup

### Option 1: GitHub Actions (Recommended)

This project includes a GitHub Actions workflow that automatically builds and deploys your dashboard.

**Setup:**
1. Push your code to GitHub (already done!)
2. Go to your repository Settings → Pages
3. Source: "GitHub Actions"
4. The workflow will automatically run on every push to `main`

**Your site will be available at:**
`https://yourusername.github.io/music`

### Option 2: Deploy from Branch (Alternative)

If you prefer a simpler approach:

1. Go to repository Settings → Pages
2. Source: "Deploy from a branch"
3. Branch: `main`
4. Folder: `/public`

## 🔄 Updating Your Dashboard

### When you get new Spotify data:

1. **Add new data to `raw/` directory**
2. **Run the build script locally:**
   ```bash
   npm run build:data
   ```
3. **Commit and push:**
   ```bash
   git add public/data/
   git commit -m "Update Spotify data"
   git push origin main
   ```
4. **GitHub Actions will automatically deploy the updates**

### Manual deployment (if needed):

You can also trigger a manual deployment:
1. Go to your repository Actions tab
2. Click "Deploy to GitHub Pages"
3. Click "Run workflow"

## 📊 What Gets Deployed

The following files are deployed to GitHub Pages:
- `public/index.html` - Your dashboard
- `public/data/summary.json` - Overall statistics
- `public/data/listening_by_year.json` - Yearly data
- `public/data/top_artists_by_year.json` - Top artists
- `public/data/top_tracks_by_year.json` - Top tracks
- `public/data/listening_daily.csv` - Daily patterns

## 🔒 Privacy Note

- Large data files in `raw/` are never uploaded
- Only processed, anonymized statistics are deployed
- Your personal data stays local

## 🛠️ Troubleshooting

### If the site doesn't load:
1. Check the Actions tab for build errors
2. Ensure `raw/merged_spotify_data.json` exists locally
3. Verify the build script runs successfully

### If charts don't appear:
1. Check browser console for errors
2. Verify data files are accessible at your domain
3. Ensure Chart.js is loading properly

## 🌐 Custom Domain (Optional)

To use a custom domain:
1. Add a `CNAME` file to `public/` with your domain
2. Configure DNS settings with your domain provider
3. Update repository Settings → Pages with your custom domain

---

**Your Spotify Wrapped dashboard will be live at:**
`https://yourusername.github.io/music` 🎵
