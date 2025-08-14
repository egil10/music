// scripts/build-spotify-simple.js
import fs from "fs";
import fse from "fs-extra";
import path from "path";
import dayjs from "dayjs";

const RAW = "raw/merged_spotify_data.json";
const OUT_DIR = "docs/data";

// Configuration for filtering and processing
const CONFIG = {
  // Outlier tracks to exclude (feature 3)
  excludedTracks: [
    { artist: "Pilt!", track: "Mary Plays the Piano" },
    { artist: "Unknown Artist", track: "Unknown Track" },
    { artist: "Local Files", track: "Unknown" }
  ],
  
  // Unknown entries mapping (feature 4)
  unknownMappings: {
    "Unknown Artist": "Misc Local",
    "Unknown Track": "Local File",
    "Unknown Album": "Local Collection"
  },
  
  // Audio features for mood radar (feature 7) - mock data
  defaultAudioFeatures: {
    valence: 0.6,    // happiness
    energy: 0.7,     // intensity
    danceability: 0.65,
    acousticness: 0.3,
    instrumentalness: 0.2,
    liveness: 0.1,
    speechiness: 0.05
  },
  
  // Genre mappings for common artists (feature 8)
  genreMappings: {
    "Taylor Swift": "Pop",
    "Drake": "Hip-Hop",
    "The Weeknd": "R&B",
    "Ed Sheeran": "Pop",
    "Post Malone": "Hip-Hop",
    "Ariana Grande": "Pop",
    "Billie Eilish": "Alternative",
    "Dua Lipa": "Pop",
    "Bad Bunny": "Reggaeton",
    "BTS": "K-Pop"
  }
};

// Helpers to read fields across Spotify variants
function pick(obj, keys, fallback = undefined) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return fallback;
}

function toYear(dateStr) {
  const d = dayjs(dateStr);
  return d.isValid() ? d.year().toString() : "unknown";
}

function toDate(dateStr) {
  const d = dayjs(dateStr);
  return d.isValid() ? d.format("YYYY-MM-DD") : null;
}

function toHour(dateStr) {
  const d = dayjs(dateStr);
  return d.isValid() ? d.hour() : 0;
}

function toDayOfWeek(dateStr) {
  const d = dayjs(dateStr);
  return d.isValid() ? d.day() : 0; // 0 = Sunday
}

function toMonth(dateStr) {
  const d = dayjs(dateStr);
  return d.isValid() ? d.format("YYYY-MM") : null;
}

// Check if track should be excluded (feature 3)
function isExcludedTrack(artist, track) {
  return CONFIG.excludedTracks.some(excluded => 
    excluded.artist === artist && excluded.track === track
  );
}

// Clean unknown entries (feature 4)
function cleanUnknownEntry(value, type) {
  if (!value || value === "Unknown") {
    return CONFIG.unknownMappings[`Unknown ${type}`] || `Unknown ${type}`;
  }
  return value;
}

// Get genre for artist (feature 8)
function getGenreForArtist(artist) {
  return CONFIG.genreMappings[artist] || "Other";
}

// Calculate binge sessions (feature 14)
function calculateBingeSessions(streamingHistory) {
  const sessions = [];
  let currentSession = null;
  const SESSION_GAP_THRESHOLD = 30 * 60 * 1000; // 30 minutes
  
  for (let i = 0; i < streamingHistory.length; i++) {
    const item = streamingHistory[i];
    const endTime = pick(item, ["endTime", "ts", "eventTime", "time"]);
    const ms = Number(pick(item, ["msPlayed", "ms_played", "ms_played_sum", "durationMs", "duration_ms"], 0)) || 0;
    
    if (!endTime || ms < 30000) continue; // Skip very short plays
    
    const timestamp = dayjs(endTime);
    
    if (!currentSession) {
      currentSession = {
        start: timestamp,
        end: timestamp,
        totalMs: ms,
        tracks: [{
          artist: pick(item, ["artistName", "master_metadata_artist_name", "artist"], "Unknown"),
          track: pick(item, ["trackName", "master_metadata_track_name", "track"], "Unknown"),
          ms: ms
        }]
      };
    } else {
      const timeDiff = timestamp.diff(currentSession.end);
      
      if (timeDiff <= SESSION_GAP_THRESHOLD) {
        // Continue session
        currentSession.end = timestamp;
        currentSession.totalMs += ms;
        currentSession.tracks.push({
          artist: pick(item, ["artistName", "master_metadata_artist_name", "artist"], "Unknown"),
          track: pick(item, ["trackName", "master_metadata_track_name", "track"], "Unknown"),
          ms: ms
        });
      } else {
        // End current session and start new one
        if (currentSession.totalMs > 300000) { // At least 5 minutes
          sessions.push({
            ...currentSession,
            start: currentSession.start.format(),
            end: currentSession.end.format(),
            duration: currentSession.end.diff(currentSession.start, 'minute'),
            hours: +(currentSession.totalMs / 1000 / 3600).toFixed(2)
          });
        }
        
        currentSession = {
          start: timestamp,
          end: timestamp,
          totalMs: ms,
          tracks: [{
            artist: pick(item, ["artistName", "master_metadata_artist_name", "artist"], "Unknown"),
            track: pick(item, ["trackName", "master_metadata_track_name", "track"], "Unknown"),
            ms: ms
          }]
        };
      }
    }
  }
  
  // Add final session
  if (currentSession && currentSession.totalMs > 300000) {
    sessions.push({
      ...currentSession,
      start: currentSession.start.format(),
      end: currentSession.end.format(),
      duration: currentSession.end.diff(currentSession.start, 'minute'),
      hours: +(currentSession.totalMs / 1000 / 3600).toFixed(2)
    });
  }
  
  return sessions.sort((a, b) => b.totalMs - a.totalMs).slice(0, 50);
}

// Calculate device usage (feature 15)
function calculateDeviceUsage(streamingHistory) {
  const deviceStats = new Map();
  
  streamingHistory.forEach(item => {
    const device = pick(item, ["platform", "device", "userAgent", "conn_country"], "Unknown Device");
    const ms = Number(pick(item, ["msPlayed", "ms_played", "ms_played_sum", "durationMs", "duration_ms"], 0)) || 0;
    
    const stats = deviceStats.get(device) || { ms: 0, plays: 0 };
    stats.ms += ms;
    stats.plays += 1;
    deviceStats.set(device, stats);
  });
  
  return Array.from(deviceStats.entries()).map(([device, stats]) => ({
    device,
    hours: +(stats.ms / 1000 / 3600).toFixed(2),
    plays: stats.plays,
    percentage: 0 // Will be calculated later
  })).sort((a, b) => b.hours - a.hours);
}

// Calculate year-over-year comparison (feature 19)
function calculateYearOverYear(artistsByYear, tracksByYear) {
  const years = Object.keys(artistsByYear).sort();
  const comparisons = {};
  
  for (let i = 1; i < years.length; i++) {
    const currentYear = years[i];
    const previousYear = years[i - 1];
    
    const currentArtists = new Map(artistsByYear[currentYear]);
    const previousArtists = new Map(artistsByYear[previousYear]);
    
    const artistChanges = [];
    const trackChanges = [];
    
    // Compare artists
    const allArtists = new Set([...currentArtists.keys(), ...previousArtists.keys()]);
    allArtists.forEach(artist => {
      const current = currentArtists.get(artist) || { ms: 0, plays: 0 };
      const previous = previousArtists.get(artist) || { ms: 0, plays: 0 };
      const change = current.ms - previous.ms;
      
      if (Math.abs(change) > 60000) { // At least 1 minute change
        artistChanges.push({
          artist,
          current: +(current.ms / 1000 / 3600).toFixed(2),
          previous: +(previous.ms / 1000 / 3600).toFixed(2),
          change: +(change / 1000 / 3600).toFixed(2)
        });
      }
    });
    
    comparisons[`${previousYear}-${currentYear}`] = {
      artists: artistChanges.sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 20),
      tracks: trackChanges.sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 20)
    };
  }
  
  return comparisons;
}

// Calculate podcast vs music split (feature 22)
function calculatePodcastSplit(streamingHistory) {
  const podcastKeywords = ['podcast', 'episode', 'show', 'interview', 'talk'];
  const musicStats = { ms: 0, plays: 0 };
  const podcastStats = { ms: 0, plays: 0 };
  
  streamingHistory.forEach(item => {
    const track = pick(item, ["trackName", "master_metadata_track_name", "track"], "").toLowerCase();
    const artist = pick(item, ["artistName", "master_metadata_artist_name", "artist"], "").toLowerCase();
    const ms = Number(pick(item, ["msPlayed", "ms_played", "ms_played_sum", "durationMs", "duration_ms"], 0)) || 0;
    
    const isPodcast = podcastKeywords.some(keyword => 
      track.includes(keyword) || artist.includes(keyword)
    );
    
    if (isPodcast) {
      podcastStats.ms += ms;
      podcastStats.plays += 1;
    } else {
      musicStats.ms += ms;
      musicStats.plays += 1;
    }
  });
  
  return {
    music: {
      hours: +(musicStats.ms / 1000 / 3600).toFixed(2),
      plays: musicStats.plays,
      percentage: +((musicStats.ms / (musicStats.ms + podcastStats.ms)) * 100).toFixed(1)
    },
    podcast: {
      hours: +(podcastStats.ms / 1000 / 3600).toFixed(2),
      plays: podcastStats.plays,
      percentage: +((podcastStats.ms / (musicStats.ms + podcastStats.ms)) * 100).toFixed(1)
    }
  };
}

// Calculate geographic data (feature 23) - mock data based on artist origins
function calculateGeographicData(artistsByYear) {
  const countryMappings = {
    "Taylor Swift": "US",
    "Drake": "CA",
    "The Weeknd": "CA",
    "Ed Sheeran": "GB",
    "Post Malone": "US",
    "Ariana Grande": "US",
    "Billie Eilish": "US",
    "Dua Lipa": "GB",
    "Bad Bunny": "PR",
    "BTS": "KR",
    "Coldplay": "GB",
    "Imagine Dragons": "US",
    "Maroon 5": "US",
    "OneRepublic": "US",
    "The Chainsmokers": "US"
  };
  
  const countryStats = new Map();
  
  Object.values(artistsByYear).forEach(yearArtists => {
    yearArtists.forEach(([artist, stats]) => {
      const country = countryMappings[artist] || "Unknown";
      const current = countryStats.get(country) || { ms: 0, plays: 0 };
      current.ms += stats.ms;
      current.plays += stats.plays;
      countryStats.set(country, current);
    });
  });
  
  return Array.from(countryStats.entries()).map(([country, stats]) => ({
    country,
    hours: +(stats.ms / 1000 / 3600).toFixed(2),
    plays: stats.plays
  })).sort((a, b) => b.hours - a.hours);
}

// Calculate valence trends (feature 27)
function calculateValenceTrends(streamingHistory) {
  const monthlyValence = new Map();
  
  streamingHistory.forEach(item => {
    const endTime = pick(item, ["endTime", "ts", "eventTime", "time"]);
    if (!endTime) return;
    
    const month = toMonth(endTime);
    if (!month) return;
    
    const artist = pick(item, ["artistName", "master_metadata_artist_name", "artist"], "Unknown");
    const track = pick(item, ["trackName", "master_metadata_track_name", "track"], "Unknown");
    
    // Mock valence based on artist/track patterns
    let valence = CONFIG.defaultAudioFeatures.valence;
    
    // Adjust based on artist (mock data)
    const artistMoodMap = {
      "Taylor Swift": 0.7,
      "Drake": 0.5,
      "The Weeknd": 0.3,
      "Ed Sheeran": 0.8,
      "Post Malone": 0.6,
      "Ariana Grande": 0.8,
      "Billie Eilish": 0.4,
      "Dua Lipa": 0.9
    };
    
    if (artistMoodMap[artist]) {
      valence = artistMoodMap[artist];
    }
    
    const current = monthlyValence.get(month) || { total: 0, count: 0 };
    current.total += valence;
    current.count += 1;
    monthlyValence.set(month, current);
  });
  
  return Array.from(monthlyValence.entries())
    .map(([month, data]) => ({
      month,
      averageValence: +(data.total / data.count).toFixed(3)
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

async function main() {
  if (!fs.existsSync(RAW)) {
    console.error(`Missing ${RAW}. Place your big JSON there (not tracked by git).`);
    process.exit(1);
  }
  await fse.ensureDir(OUT_DIR);

  console.log("Reading data file...");
  const rawData = JSON.parse(fs.readFileSync(RAW, 'utf8'));
  
  if (!rawData.streaming_history || !Array.isArray(rawData.streaming_history)) {
    console.error("No streaming_history array found in the data");
    process.exit(1);
  }

  const streamingHistory = rawData.streaming_history;
  console.log(`Processing ${streamingHistory.length} streaming history items...`);

  // Aggregates
  const byYear = {};            // year -> { ms: number, plays: number }
  const artistsByYear = {};     // year -> Map(artist -> { ms, plays })
  const tracksByYear = {};      // year -> Map(trackKey -> { artist, track, ms, plays })
  const byDay = new Map();      // "YYYY-MM-DD" -> { ms, plays }
  const byHour = new Map();     // hour -> { ms, plays }
  const byDayOfWeek = new Map(); // day -> { ms, plays }
  const byMonth = new Map();    // "YYYY-MM" -> { ms, plays }
  const genres = new Map();     // genre -> { ms, plays }
  const allTracks = [];         // For search functionality
  let totalMs = 0, totalPlays = 0;
  let excludedCount = 0;

  console.log("Aggregating data...");

  streamingHistory.forEach((item, index) => {
    if (index % 10000 === 0) {
      console.log(`Processed ${index} items...`);
    }

    // Common field names across exports
    const endTime = pick(item, ["endTime", "ts", "eventTime", "time"], null);
    let artist = pick(item, ["artistName", "master_metadata_artist_name", "artist"], "Unknown Artist");
    let track = pick(item, ["trackName", "master_metadata_track_name", "track"], "Unknown Track");
    const ms = Number(pick(item, ["msPlayed", "ms_played", "ms_played_sum", "durationMs", "duration_ms"], 0)) || 0;

    // Clean unknown entries (feature 4)
    artist = cleanUnknownEntry(artist, "Artist");
    track = cleanUnknownEntry(track, "Track");

    // Check for excluded tracks (feature 3)
    if (isExcludedTrack(artist, track)) {
      excludedCount++;
      return;
    }

    const year = endTime ? toYear(endTime) : "unknown";
    const day = endTime ? toDate(endTime) : null;
    const hour = endTime ? toHour(endTime) : 0;
    const dayOfWeek = endTime ? toDayOfWeek(endTime) : 0;
    const month = endTime ? toMonth(endTime) : null;

    // totals
    totalMs += ms;
    totalPlays += 1;

    // by year
    if (!byYear[year]) byYear[year] = { ms: 0, plays: 0 };
    byYear[year].ms += ms;
    byYear[year].plays += 1;

    // artists per year
    if (!artistsByYear[year]) artistsByYear[year] = new Map();
    const aEntry = artistsByYear[year].get(artist) || { ms: 0, plays: 0 };
    aEntry.ms += ms; aEntry.plays += 1;
    artistsByYear[year].set(artist, aEntry);

    // tracks per year
    if (!tracksByYear[year]) tracksByYear[year] = new Map();
    const tKey = `${artist}::${track}`;
    const tEntry = tracksByYear[year].get(tKey) || { artist, track, ms: 0, plays: 0 };
    tEntry.ms += ms; tEntry.plays += 1;
    tracksByYear[year].set(tKey, tEntry);

    // daily series
    if (day) {
      const dEntry = byDay.get(day) || { ms: 0, plays: 0 };
      dEntry.ms += ms; dEntry.plays += 1;
      byDay.set(day, dEntry);
    }

    // hourly series
    const hEntry = byHour.get(hour) || { ms: 0, plays: 0 };
    hEntry.ms += ms; hEntry.plays += 1;
    byHour.set(hour, hEntry);

    // day of week series
    const dowEntry = byDayOfWeek.get(dayOfWeek) || { ms: 0, plays: 0 };
    dowEntry.ms += ms; dowEntry.plays += 1;
    byDayOfWeek.set(dayOfWeek, dowEntry);

    // monthly series
    if (month) {
      const mEntry = byMonth.get(month) || { ms: 0, plays: 0 };
      mEntry.ms += ms; mEntry.plays += 1;
      byMonth.set(month, mEntry);
    }

    // genre aggregation (feature 8)
    const genre = getGenreForArtist(artist);
    const gEntry = genres.get(genre) || { ms: 0, plays: 0 };
    gEntry.ms += ms; gEntry.plays += 1;
    genres.set(genre, gEntry);

    // Add to searchable tracks (feature 16)
    allTracks.push({
      artist,
      track,
      album: pick(item, ["albumName", "master_metadata_album_album_name", "album"], "Unknown Album"),
      ms,
      plays: 1,
      year
    });
  });

  console.log(`Excluded ${excludedCount} tracks due to filtering rules`);

  console.log("Calculating advanced analytics...");

  // Calculate binge sessions (feature 14)
  const bingeSessions = calculateBingeSessions(streamingHistory);

  // Calculate device usage (feature 15)
  const deviceUsage = calculateDeviceUsage(streamingHistory);
  const totalDeviceMs = deviceUsage.reduce((sum, device) => sum + (device.hours * 3600 * 1000), 0);
  deviceUsage.forEach(device => {
    device.percentage = +((device.hours * 3600 * 1000 / totalDeviceMs) * 100).toFixed(1);
  });

  // Calculate year-over-year comparison (feature 19)
  const yearOverYear = calculateYearOverYear(artistsByYear, tracksByYear);

  // Calculate podcast vs music split (feature 22)
  const podcastSplit = calculatePodcastSplit(streamingHistory);

  // Calculate geographic data (feature 23)
  const geographicData = calculateGeographicData(artistsByYear);

  // Calculate valence trends (feature 27)
  const valenceTrends = calculateValenceTrends(streamingHistory);

  console.log("Writing outputs…");

  // 1) Summary
  const summary = {
    total_ms: totalMs,
    total_hours: +(totalMs / 1000 / 3600).toFixed(2),
    total_plays: totalPlays,
    years: Object.keys(byYear).sort(),
    excluded_tracks: excludedCount,
    podcast_split: podcastSplit
  };
  await fse.writeJson(path.join(OUT_DIR, "summary.json"), summary, { spaces: 2 });

  // 2) Per-year rollups
  const perYear = Object.fromEntries(
    Object.entries(byYear).sort(([a], [b]) => a.localeCompare(b)).map(([y, v]) => {
      const hours = +(v.ms / 1000 / 3600).toFixed(2);
      return [y, { ...v, hours }];
    })
  );
  await fse.writeJson(path.join(OUT_DIR, "listening_by_year.json"), perYear, { spaces: 2 });

  // 3) Top artists & tracks per year (top 50)
  const topArtistsByYear = {};
  const topTracksByYear = {};
  for (const y of Object.keys(artistsByYear)) {
    topArtistsByYear[y] = [...artistsByYear[y].entries()]
      .map(([artist, v]) => ({ artist, plays: v.plays, hours: +(v.ms / 1000 / 3600).toFixed(2) }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 50);

    topTracksByYear[y] = [...tracksByYear[y].values()]
      .map(v => ({ artist: v.artist, track: v.track, plays: v.plays, hours: +(v.ms / 1000 / 3600).toFixed(2) }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 50);
  }
  await fse.writeJson(path.join(OUT_DIR, "top_artists_by_year.json"), topArtistsByYear, { spaces: 2 });
  await fse.writeJson(path.join(OUT_DIR, "top_tracks_by_year.json"), topTracksByYear, { spaces: 2 });

  // 4) Daily time series CSV (easy to chart anywhere)
  const dailyRows = [["date", "hours", "plays"]];
  [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).forEach(([date, v]) => {
    dailyRows.push([date, (v.ms / 1000 / 3600).toFixed(3), v.plays]);
  });
  fs.writeFileSync(
    path.join(OUT_DIR, "listening_daily.csv"),
    dailyRows.map(r => r.join(",")).join("\n"),
    "utf8"
  );

  // 5) Hourly data (feature 9)
  const hourlyData = Array.from(byHour.entries())
    .sort(([a], [b]) => a - b)
    .map(([hour, data]) => ({
      hour,
      hours: +(data.ms / 1000 / 3600).toFixed(3),
      plays: data.plays
    }));
  await fse.writeJson(path.join(OUT_DIR, "listening_by_hour.json"), hourlyData, { spaces: 2 });

  // 6) Day of week data
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayOfWeekData = Array.from(byDayOfWeek.entries())
    .sort(([a], [b]) => a - b)
    .map(([day, data]) => ({
      day: dayNames[day],
      dayNumber: day,
      hours: +(data.ms / 1000 / 3600).toFixed(3),
      plays: data.plays
    }));
  await fse.writeJson(path.join(OUT_DIR, "listening_by_day_of_week.json"), dayOfWeekData, { spaces: 2 });

  // 7) Monthly data
  const monthlyData = Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      hours: +(data.ms / 1000 / 3600).toFixed(3),
      plays: data.plays
    }));
  await fse.writeJson(path.join(OUT_DIR, "listening_by_month.json"), monthlyData, { spaces: 2 });

  // 8) Genre breakdown (feature 8)
  const genreBreakdown = Array.from(genres.entries())
    .map(([genre, data]) => ({
      genre,
      hours: +(data.ms / 1000 / 3600).toFixed(2),
      plays: data.plays,
      percentage: +((data.ms / totalMs) * 100).toFixed(1)
    }))
    .sort((a, b) => b.hours - a.hours);
  await fse.writeJson(path.join(OUT_DIR, "genre_breakdown.json"), genreBreakdown, { spaces: 2 });

  // 9) Binge sessions (feature 14)
  await fse.writeJson(path.join(OUT_DIR, "binge_sessions.json"), bingeSessions, { spaces: 2 });

  // 10) Device usage (feature 15)
  await fse.writeJson(path.join(OUT_DIR, "device_usage.json"), deviceUsage, { spaces: 2 });

  // 11) Year-over-year comparison (feature 19)
  await fse.writeJson(path.join(OUT_DIR, "year_over_year.json"), yearOverYear, { spaces: 2 });

  // 12) Geographic data (feature 23)
  await fse.writeJson(path.join(OUT_DIR, "geographic_data.json"), geographicData, { spaces: 2 });

  // 13) Valence trends (feature 27)
  await fse.writeJson(path.join(OUT_DIR, "valence_trends.json"), valenceTrends, { spaces: 2 });

  // 14) Searchable tracks (feature 16)
  const searchableTracks = allTracks.reduce((acc, track) => {
    const key = `${track.artist}::${track.track}`;
    if (acc[key]) {
      acc[key].ms += track.ms;
      acc[key].plays += track.plays;
    } else {
      acc[key] = track;
    }
    return acc;
  }, {});
  
  const searchableTracksArray = Object.values(searchableTracks)
    .map(track => ({
      ...track,
      hours: +(track.ms / 1000 / 3600).toFixed(2)
    }))
    .sort((a, b) => b.hours - a.hours);
  
  await fse.writeJson(path.join(OUT_DIR, "searchable_tracks.json"), searchableTracksArray, { spaces: 2 });

  // 15) All-time top artists and tracks
  const allTimeArtists = new Map();
  const allTimeTracks = new Map();
  
  Object.values(artistsByYear).forEach(yearArtists => {
    yearArtists.forEach(([artist, stats]) => {
      const current = allTimeArtists.get(artist) || { ms: 0, plays: 0 };
      current.ms += stats.ms;
      current.plays += stats.plays;
      allTimeArtists.set(artist, current);
    });
  });
  
  Object.values(tracksByYear).forEach(yearTracks => {
    yearTracks.forEach(([key, stats]) => {
      const current = allTimeTracks.get(key) || { ...stats, ms: 0, plays: 0 };
      current.ms += stats.ms;
      current.plays += stats.plays;
      allTimeTracks.set(key, current);
    });
  });
  
  const topArtistsAllTime = Array.from(allTimeArtists.entries())
    .map(([artist, stats]) => ({
      artist,
      hours: +(stats.ms / 1000 / 3600).toFixed(2),
      plays: stats.plays
    }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 100);
  
  const topTracksAllTime = Array.from(allTimeTracks.values())
    .map(track => ({
      artist: track.artist,
      track: track.track,
      hours: +(track.ms / 1000 / 3600).toFixed(2),
      plays: track.plays
    }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 100);
  
  await fse.writeJson(path.join(OUT_DIR, "top_artists_all_time.json"), topArtistsAllTime, { spaces: 2 });
  await fse.writeJson(path.join(OUT_DIR, "top_tracks_all_time.json"), topTracksAllTime, { spaces: 2 });

  console.log(`Done. Files in ${OUT_DIR}/:
  - summary.json
  - listening_by_year.json
  - top_artists_by_year.json
  - top_tracks_by_year.json
  - listening_daily.csv
  - listening_by_hour.json
  - listening_by_day_of_week.json
  - listening_by_month.json
  - genre_breakdown.json
  - binge_sessions.json
  - device_usage.json
  - year_over_year.json
  - geographic_data.json
  - valence_trends.json
  - searchable_tracks.json
  - top_artists_all_time.json
  - top_tracks_all_time.json
  `);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
