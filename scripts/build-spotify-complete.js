// scripts/build-spotify-complete.js
import fs from "fs";
import fse from "fs-extra";
import path from "path";
import dayjs from "dayjs";

const OUT_DIR = "docs/data";

// Manual exclusion list - tracks/artists to always filter out
const MANUAL_EXCLUSIONS = {
  artists: ["Pilt!", "Unknown Artist"],
  tracks: ["mary plays the piano", "unknown track"],
  keywords: ["test", "demo", "sample"]
};

// Outlier detection settings
const OUTLIER_SETTINGS = {
  zScoreThreshold: 3.0, // Standard deviations for outlier detection
  percentileCap: 99.5, // Cap at 99.5th percentile
  minPlayTime: 30000, // Minimum 30 seconds to be considered valid
  maxPlayTime: 3600000 // Maximum 1 hour per play (likely an error)
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

function toMonth(dateStr) {
  const d = dayjs(dateStr);
  return d.isValid() ? d.format("YYYY-MM") : null;
}

function toHour(dateStr) {
  const d = dayjs(dateStr);
  return d.isValid() ? d.hour() : null;
}

function toDayOfWeek(dateStr) {
  const d = dayjs(dateStr);
  return d.isValid() ? d.day() : null; // 0 = Sunday, 6 = Saturday
}

// Statistical functions for outlier detection
function calculateStats(values) {
  const n = values.length;
  if (n === 0) return { mean: 0, std: 0, median: 0, q1: 0, q3: 0 };
  
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const std = Math.sqrt(variance);
  
  const median = sorted[Math.floor(n / 2)];
  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  
  return { mean, std, median, q1, q3 };
}

function calculateZScore(value, mean, std) {
  return std === 0 ? 0 : (value - mean) / std;
}

function isOutlier(value, mean, std, threshold = OUTLIER_SETTINGS.zScoreThreshold) {
  const zScore = calculateZScore(value, mean, std);
  return Math.abs(zScore) > threshold;
}

// Filtering functions
function shouldExcludeTrack(item) {
  const artist = pick(item, ["artistName", "master_metadata_artist_name", "artist"], "").toLowerCase();
  const track = pick(item, ["trackName", "master_metadata_track_name", "track"], "").toLowerCase();
  const ms = Number(pick(item, ["msPlayed", "ms_played", "ms_played_sum", "durationMs", "duration_ms"], 0)) || 0;
  
  // Manual exclusions
  if (MANUAL_EXCLUSIONS.artists.some(ex => artist.includes(ex.toLowerCase()))) {
    return { excluded: true, reason: "manual_artist_exclusion" };
  }
  
  if (MANUAL_EXCLUSIONS.tracks.some(ex => track.includes(ex.toLowerCase()))) {
    return { excluded: true, reason: "manual_track_exclusion" };
  }
  
  if (MANUAL_EXCLUSIONS.keywords.some(keyword => 
    artist.includes(keyword.toLowerCase()) || track.includes(keyword.toLowerCase())
  )) {
    return { excluded: true, reason: "manual_keyword_exclusion" };
  }
  
  // Unknown track/artist exclusions
  if (artist.includes("unknown") || track.includes("unknown")) {
    return { excluded: true, reason: "unknown_metadata" };
  }
  
  // Play time validation
  if (ms < OUTLIER_SETTINGS.minPlayTime) {
    return { excluded: true, reason: "too_short" };
  }
  
  if (ms > OUTLIER_SETTINGS.maxPlayTime) {
    return { excluded: true, reason: "too_long" };
  }
  
  return { excluded: false, reason: null };
}

// Function to process a single streaming history file
function processStreamingFile(filePath) {
  console.log(`Processing ${filePath}...`);
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Handle different file structures
    let streamingHistory = [];
    
    if (Array.isArray(data)) {
      // Direct array of streaming items
      streamingHistory = data;
    } else if (data.streaming_history && Array.isArray(data.streaming_history)) {
      // Nested streaming_history array
      streamingHistory = data.streaming_history;
    } else if (data.endTime || data.ts || data.eventTime || data.time) {
      // Single item
      streamingHistory = [data];
    }
    
    console.log(`  Found ${streamingHistory.length} streaming items`);
    return streamingHistory;
    
  } catch (error) {
    console.error(`  Error processing ${filePath}:`, error.message);
    return [];
  }
}

async function main() {
  await fse.ensureDir(OUT_DIR);

  console.log("Processing ALL historical Spotify data...");

  // Collect all streaming history files
  const streamingFiles = [];
  
  // Extended Streaming History (2015-2025)
  const extendedHistoryDir = "Spotify Extended Streaming History";
  if (fs.existsSync(extendedHistoryDir)) {
    const files = fs.readdirSync(extendedHistoryDir);
    files.forEach(file => {
      if (file.endsWith('.json') && file.includes('Streaming_History_Audio')) {
        streamingFiles.push(path.join(extendedHistoryDir, file));
      }
    });
  }
  
  // Regular Streaming History
  const accountDataDir = "Spotify Account Data";
  if (fs.existsSync(accountDataDir)) {
    const files = fs.readdirSync(accountDataDir);
    files.forEach(file => {
      if (file.includes('StreamingHistory_music')) {
        streamingFiles.push(path.join(accountDataDir, file));
      }
    });
  }

  console.log(`Found ${streamingFiles.length} streaming history files:`);
  streamingFiles.forEach(file => console.log(`  - ${file}`));

  if (streamingFiles.length === 0) {
    console.error("No streaming history files found!");
    process.exit(1);
  }

  // Process all files and combine data
  let allStreamingHistory = [];
  
  for (const file of streamingFiles) {
    const fileData = processStreamingFile(file);
    allStreamingHistory = allStreamingHistory.concat(fileData);
  }

  console.log(`\nTotal streaming history items: ${allStreamingHistory.length}`);

  // Remove duplicates (same track, artist, and timestamp)
  const uniqueItems = new Map();
  allStreamingHistory.forEach(item => {
    const endTime = pick(item, ["endTime", "ts", "eventTime", "time"], null);
    const artist = pick(item, ["artistName", "master_metadata_artist_name", "artist"], "Unknown Artist");
    const track = pick(item, ["trackName", "master_metadata_track_name", "track"], "Unknown Track");
    
    const key = `${endTime}::${artist}::${track}`;
    if (!uniqueItems.has(key)) {
      uniqueItems.set(key, item);
    }
  });

  const streamingHistory = Array.from(uniqueItems.values());
  console.log(`After removing duplicates: ${streamingHistory.length} items`);

  // Sort by date for proper timeline analysis
  streamingHistory.sort((a, b) => {
    const aTime = pick(a, ["endTime", "ts", "eventTime", "time"], "");
    const bTime = pick(b, ["endTime", "ts", "eventTime", "time"], "");
    return aTime.localeCompare(bTime);
  });

  // Pre-filtering and outlier detection
  console.log("\n🔍 Performing outlier detection and filtering...");
  
  const playTimes = streamingHistory.map(item => 
    Number(pick(item, ["msPlayed", "ms_played", "ms_played_sum", "durationMs", "duration_ms"], 0)) || 0
  ).filter(ms => ms > 0);
  
  const stats = calculateStats(playTimes);
  const percentile95 = playTimes.sort((a, b) => a - b)[Math.floor(playTimes.length * 0.95)];
  const percentile99 = playTimes.sort((a, b) => a - b)[Math.floor(playTimes.length * 0.99)];
  
  console.log(`📊 Play time statistics:`);
  console.log(`  - Mean: ${(stats.mean / 1000 / 60).toFixed(2)} minutes`);
  console.log(`  - Std Dev: ${(stats.std / 1000 / 60).toFixed(2)} minutes`);
  console.log(`  - 95th percentile: ${(percentile95 / 1000 / 60).toFixed(2)} minutes`);
  console.log(`  - 99th percentile: ${(percentile99 / 1000 / 60).toFixed(2)} minutes`);

  // Filter items and collect exclusion statistics
  const filteredHistory = [];
  const exclusionStats = {
    manual_artist_exclusion: 0,
    manual_track_exclusion: 0,
    manual_keyword_exclusion: 0,
    unknown_metadata: 0,
    too_short: 0,
    too_long: 0,
    outlier_zscore: 0,
    outlier_percentile: 0
  };

  streamingHistory.forEach(item => {
    const ms = Number(pick(item, ["msPlayed", "ms_played", "ms_played_sum", "durationMs", "duration_ms"], 0)) || 0;
    
    // Apply manual exclusions and basic filters
    const exclusion = shouldExcludeTrack(item);
    if (exclusion.excluded) {
      exclusionStats[exclusion.reason]++;
      return;
    }
    
    // Outlier detection using Z-score
    if (isOutlier(ms, stats.mean, stats.std)) {
      exclusionStats.outlier_zscore++;
      return;
    }
    
    // Outlier detection using percentile
    if (ms > percentile99) {
      exclusionStats.outlier_percentile++;
      return;
    }
    
    // Apply percentile capping (normalize extreme values)
    const cappedMs = Math.min(ms, percentile99);
    const normalizedItem = { ...item };
    
    // Update the ms value in the item (find the correct field)
    const msFields = ["msPlayed", "ms_played", "ms_played_sum", "durationMs", "duration_ms"];
    for (const field of msFields) {
      if (item[field] !== undefined) {
        normalizedItem[field] = cappedMs;
        break;
      }
    }
    
    filteredHistory.push(normalizedItem);
  });

  console.log(`\n📈 Filtering results:`);
  console.log(`  - Original items: ${streamingHistory.length}`);
  console.log(`  - Filtered items: ${filteredHistory.length}`);
  console.log(`  - Excluded items: ${streamingHistory.length - filteredHistory.length}`);
  
  Object.entries(exclusionStats).forEach(([reason, count]) => {
    if (count > 0) {
      console.log(`    - ${reason}: ${count} items`);
    }
  });

  // Enhanced aggregates for all the new features
  const byYear = {};                    // year -> { ms: number, plays: number }
  const artistsByYear = {};             // year -> Map(artist -> { ms, plays, firstPlay, lastPlay })
  const tracksByYear = {};              // year -> Map(trackKey -> { artist, track, ms, plays, firstPlay, lastPlay })
  const byDay = new Map();              // "YYYY-MM-DD" -> { ms, plays }
  const byMonth = new Map();            // "YYYY-MM" -> { ms, plays }
  const byHour = {};                    // hour -> { ms, plays }
  const byDayOfWeek = {};               // dayOfWeek -> { ms, plays }
  const byArtist = new Map();           // artist -> { ms, plays, firstPlay, lastPlay, tracks: Set }
  const byTrack = new Map();            // trackKey -> { artist, track, ms, plays, firstPlay, lastPlay }
  const byAlbum = new Map();            // album -> { ms, plays, artist, tracks: Set }
  const byGenre = new Map();            // genre -> { ms, plays, artists: Set }
  const listeningSessions = [];         // Array of session objects for binge analysis
  const deviceUsage = {};               // device -> { ms, plays }
  const playlistAdditions = new Map();  // trackKey -> { addedToPlaylists: [], totalPlays }
  
  let totalMs = 0, totalPlays = 0;
  let currentSession = null;

  console.log("\nAggregating data with enhanced features...");

  filteredHistory.forEach((item, index) => {
    if (index % 10000 === 0) {
      console.log(`  Processed ${index} items...`);
    }

    // Common field names across exports
    const endTime = pick(item, ["endTime", "ts", "eventTime", "time"], null);
    const artist = pick(item, ["artistName", "master_metadata_artist_name", "artist"], "Unknown Artist");
    const track = pick(item, ["trackName", "master_metadata_track_name", "track"], "Unknown Track");
    const album = pick(item, ["albumName", "master_metadata_album_album_name", "album"], "Unknown Album");
    const ms = Number(
      pick(item, ["msPlayed", "ms_played", "ms_played_sum", "durationMs", "duration_ms"], 0)
    ) || 0;
    const device = pick(item, ["platform", "device", "userAgent"], "Unknown Device");
    const genre = pick(item, ["genre", "master_metadata_album_album_name"], "Unknown Genre");

    const year = endTime ? toYear(endTime) : "unknown";
    const day = endTime ? toDate(endTime) : null;
    const month = endTime ? toMonth(endTime) : null;
    const hour = endTime ? toHour(endTime) : null;
    const dayOfWeek = endTime ? toDayOfWeek(endTime) : null;

    // Skip items with no play time
    if (ms <= 0) return;

    // totals
    totalMs += ms;
    totalPlays += 1;

    // by year
    if (!byYear[year]) byYear[year] = { ms: 0, plays: 0 };
    byYear[year].ms += ms;
    byYear[year].plays += 1;

    // artists per year
    if (!artistsByYear[year]) artistsByYear[year] = new Map();
    const aEntry = artistsByYear[year].get(artist) || { ms: 0, plays: 0, firstPlay: endTime, lastPlay: endTime };
    aEntry.ms += ms; 
    aEntry.plays += 1;
    if (endTime && (!aEntry.firstPlay || endTime < aEntry.firstPlay)) aEntry.firstPlay = endTime;
    if (endTime && (!aEntry.lastPlay || endTime > aEntry.lastPlay)) aEntry.lastPlay = endTime;
    artistsByYear[year].set(artist, aEntry);

    // tracks per year
    if (!tracksByYear[year]) tracksByYear[year] = new Map();
    const tKey = `${artist}::${track}`;
    const tEntry = tracksByYear[year].get(tKey) || { artist, track, ms: 0, plays: 0, firstPlay: endTime, lastPlay: endTime };
    tEntry.ms += ms; 
    tEntry.plays += 1;
    if (endTime && (!tEntry.firstPlay || endTime < tEntry.firstPlay)) tEntry.firstPlay = endTime;
    if (endTime && (!tEntry.lastPlay || endTime > tEntry.lastPlay)) tEntry.lastPlay = endTime;
    tracksByYear[year].set(tKey, tEntry);

    // daily series
    if (day) {
      const dEntry = byDay.get(day) || { ms: 0, plays: 0 };
      dEntry.ms += ms; dEntry.plays += 1;
      byDay.set(day, dEntry);
    }

    // monthly series
    if (month) {
      const mEntry = byMonth.get(month) || { ms: 0, plays: 0 };
      mEntry.ms += ms; mEntry.plays += 1;
      byMonth.set(month, mEntry);
    }

    // hourly analysis
    if (hour !== null) {
      if (!byHour[hour]) byHour[hour] = { ms: 0, plays: 0 };
      byHour[hour].ms += ms;
      byHour[hour].plays += 1;
    }

    // day of week analysis
    if (dayOfWeek !== null) {
      if (!byDayOfWeek[dayOfWeek]) byDayOfWeek[dayOfWeek] = { ms: 0, plays: 0 };
      byDayOfWeek[dayOfWeek].ms += ms;
      byDayOfWeek[dayOfWeek].plays += 1;
    }

    // artist analysis
    const artistEntry = byArtist.get(artist) || { ms: 0, plays: 0, firstPlay: endTime, lastPlay: endTime, tracks: new Set() };
    artistEntry.ms += ms;
    artistEntry.plays += 1;
    artistEntry.tracks.add(track);
    if (endTime && (!artistEntry.firstPlay || endTime < artistEntry.firstPlay)) artistEntry.firstPlay = endTime;
    if (endTime && (!artistEntry.lastPlay || endTime > artistEntry.lastPlay)) artistEntry.lastPlay = endTime;
    byArtist.set(artist, artistEntry);

    // track analysis
    const trackEntry = byTrack.get(tKey) || { artist, track, ms: 0, plays: 0, firstPlay: endTime, lastPlay: endTime };
    trackEntry.ms += ms;
    trackEntry.plays += 1;
    if (endTime && (!trackEntry.firstPlay || endTime < trackEntry.firstPlay)) trackEntry.firstPlay = endTime;
    if (endTime && (!trackEntry.lastPlay || endTime > trackEntry.lastPlay)) trackEntry.lastPlay = endTime;
    byTrack.set(tKey, trackEntry);

    // album analysis
    const albumKey = `${artist}::${album}`;
    const albumEntry = byAlbum.get(albumKey) || { artist, album, ms: 0, plays: 0, tracks: new Set() };
    albumEntry.ms += ms;
    albumEntry.plays += 1;
    albumEntry.tracks.add(track);
    byAlbum.set(albumKey, albumEntry);

    // genre analysis
    const genreEntry = byGenre.get(genre) || { ms: 0, plays: 0, artists: new Set() };
    genreEntry.ms += ms;
    genreEntry.plays += 1;
    genreEntry.artists.add(artist);
    byGenre.set(genre, genreEntry);

    // device usage
    if (!deviceUsage[device]) deviceUsage[device] = { ms: 0, plays: 0 };
    deviceUsage[device].ms += ms;
    deviceUsage[device].plays += 1;

    // Listening session analysis (binge detection)
    if (currentSession && endTime) {
      const timeDiff = dayjs(endTime).diff(dayjs(currentSession.lastPlay), 'minute');
      if (timeDiff <= 30) { // 30 minute gap = same session
        currentSession.tracks.push({ artist, track, ms, endTime });
        currentSession.totalMs += ms;
        currentSession.lastPlay = endTime;
      } else {
        // End current session and start new one
        if (currentSession.tracks.length > 1) {
          listeningSessions.push(currentSession);
        }
        currentSession = {
          startTime: endTime,
          lastPlay: endTime,
          tracks: [{ artist, track, ms, endTime }],
          totalMs: ms
        };
      }
    } else {
      currentSession = {
        startTime: endTime,
        lastPlay: endTime,
        tracks: [{ artist, track, ms, endTime }],
        totalMs: ms
      };
    }
  });

  // Add final session
  if (currentSession && currentSession.tracks.length > 1) {
    listeningSessions.push(currentSession);
  }

  console.log("\nWriting enhanced outputs...");

  // 1) Enhanced Summary with filtering stats
  const summary = {
    total_ms: totalMs,
    total_hours: +(totalMs / 1000 / 3600).toFixed(2),
    total_plays: totalPlays,
    years: Object.keys(byYear).filter(y => y !== "unknown").sort(),
    data_sources: streamingFiles.length,
    date_range: {
      earliest: filteredHistory.length > 0 ? 
        dayjs(pick(filteredHistory[0], ["endTime", "ts", "eventTime", "time"])).format("YYYY-MM-DD") : "Unknown",
      latest: filteredHistory.length > 0 ? 
        dayjs(pick(filteredHistory[filteredHistory.length - 1], ["endTime", "ts", "eventTime", "time"])).format("YYYY-MM-DD") : "Unknown"
    },
    unique_artists: byArtist.size,
    unique_tracks: byTrack.size,
    unique_albums: byAlbum.size,
    listening_sessions: listeningSessions.length,
    longest_session_hours: listeningSessions.length > 0 ? 
      +(Math.max(...listeningSessions.map(s => s.totalMs)) / 1000 / 3600).toFixed(2) : 0,
    filtering_stats: {
      original_items: streamingHistory.length,
      filtered_items: filteredHistory.length,
      excluded_items: streamingHistory.length - filteredHistory.length,
      exclusion_breakdown: exclusionStats
    },
    outlier_detection: {
      mean_play_time_minutes: +(stats.mean / 1000 / 60).toFixed(2),
      std_dev_minutes: +(stats.std / 1000 / 60).toFixed(2),
      percentile_95_minutes: +(percentile95 / 1000 / 60).toFixed(2),
      percentile_99_minutes: +(percentile99 / 1000 / 60).toFixed(2)
    }
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

  // 3) Enhanced top artists & tracks per year
  const topArtistsByYear = {};
  const topTracksByYear = {};
  for (const y of Object.keys(artistsByYear)) {
    topArtistsByYear[y] = [...artistsByYear[y].entries()]
      .map(([artist, v]) => ({ 
        artist, 
        plays: v.plays, 
        hours: +(v.ms / 1000 / 3600).toFixed(2),
        firstPlay: v.firstPlay,
        lastPlay: v.lastPlay
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 50);

    topTracksByYear[y] = [...tracksByYear[y].values()]
      .map(v => ({ 
        artist: v.artist, 
        track: v.track, 
        plays: v.plays, 
        hours: +(v.ms / 1000 / 3600).toFixed(2),
        firstPlay: v.firstPlay,
        lastPlay: v.lastPlay
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 50);
  }
  await fse.writeJson(path.join(OUT_DIR, "top_artists_by_year.json"), topArtistsByYear, { spaces: 2 });
  await fse.writeJson(path.join(OUT_DIR, "top_tracks_by_year.json"), topTracksByYear, { spaces: 2 });

  // 4) Daily time series CSV
  const dailyRows = [["date", "hours", "plays"]];
  [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).forEach(([date, v]) => {
    dailyRows.push([date, (v.ms / 1000 / 3600).toFixed(3), v.plays]);
  });
  fs.writeFileSync(
    path.join(OUT_DIR, "listening_daily.csv"),
    dailyRows.map(r => r.join(",")).join("\n"),
    "utf8"
  );

  // 5) Monthly time series
  const monthlyData = [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({
    month,
    hours: +(v.ms / 1000 / 3600).toFixed(2),
    plays: v.plays
  }));
  await fse.writeJson(path.join(OUT_DIR, "listening_by_month.json"), monthlyData, { spaces: 2 });

  // 6) Hourly analysis
  const hourlyData = Object.entries(byHour).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([hour, v]) => ({
    hour: parseInt(hour),
    hours: +(v.ms / 1000 / 3600).toFixed(2),
    plays: v.plays
  }));
  await fse.writeJson(path.join(OUT_DIR, "listening_by_hour.json"), hourlyData, { spaces: 2 });

  // 7) Day of week analysis
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeekData = Object.entries(byDayOfWeek).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([day, v]) => ({
    day: parseInt(day),
    dayName: dayNames[parseInt(day)],
    hours: +(v.ms / 1000 / 3600).toFixed(2),
    plays: v.plays
  }));
  await fse.writeJson(path.join(OUT_DIR, "listening_by_day_of_week.json"), dayOfWeekData, { spaces: 2 });

  // 8) All-time top artists
  const allTimeTopArtists = [...byArtist.entries()]
    .map(([artist, v]) => ({
      artist,
      plays: v.plays,
      hours: +(v.ms / 1000 / 3600).toFixed(2),
      uniqueTracks: v.tracks.size,
      firstPlay: v.firstPlay,
      lastPlay: v.lastPlay
    }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 100);
  await fse.writeJson(path.join(OUT_DIR, "top_artists_all_time.json"), allTimeTopArtists, { spaces: 2 });

  // 9) All-time top tracks
  const allTimeTopTracks = [...byTrack.entries()]
    .map(([key, v]) => ({
      artist: v.artist,
      track: v.track,
      plays: v.plays,
      hours: +(v.ms / 1000 / 3600).toFixed(2),
      firstPlay: v.firstPlay,
      lastPlay: v.lastPlay
    }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 100);
  await fse.writeJson(path.join(OUT_DIR, "top_tracks_all_time.json"), allTimeTopTracks, { spaces: 2 });

  // 10) Top albums
  const topAlbums = [...byAlbum.entries()]
    .map(([key, v]) => ({
      artist: v.artist,
      album: v.album,
      plays: v.plays,
      hours: +(v.ms / 1000 / 3600).toFixed(2),
      uniqueTracks: v.tracks.size
    }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 50);
  await fse.writeJson(path.join(OUT_DIR, "top_albums.json"), topAlbums, { spaces: 2 });

  // 11) Genre breakdown
  const genreBreakdown = [...byGenre.entries()]
    .map(([genre, v]) => ({
      genre,
      plays: v.plays,
      hours: +(v.ms / 1000 / 3600).toFixed(2),
      uniqueArtists: v.artists.size
    }))
    .sort((a, b) => b.hours - a.hours);
  await fse.writeJson(path.join(OUT_DIR, "genre_breakdown.json"), genreBreakdown, { spaces: 2 });

  // 12) Device usage
  const deviceUsageData = Object.entries(deviceUsage).map(([device, v]) => ({
    device,
    plays: v.plays,
    hours: +(v.ms / 1000 / 3600).toFixed(2)
  })).sort((a, b) => b.hours - a.hours);
  await fse.writeJson(path.join(OUT_DIR, "device_usage.json"), deviceUsageData, { spaces: 2 });

  // 13) Listening sessions (binge analysis)
  const bingeSessions = listeningSessions
    .map(session => ({
      startTime: session.startTime,
      endTime: session.lastPlay,
      durationMinutes: dayjs(session.lastPlay).diff(dayjs(session.startTime), 'minute'),
      totalHours: +(session.totalMs / 1000 / 3600).toFixed(2),
      trackCount: session.tracks.length,
      tracks: session.tracks.map(t => ({ artist: t.artist, track: t.track }))
    }))
    .sort((a, b) => b.totalHours - a.totalHours)
    .slice(0, 20);
  await fse.writeJson(path.join(OUT_DIR, "binge_sessions.json"), bingeSessions, { spaces: 2 });

  // 14) Filtering configuration for UI
  const filteringConfig = {
    manual_exclusions: MANUAL_EXCLUSIONS,
    outlier_settings: OUTLIER_SETTINGS,
    stats: {
      mean_play_time_minutes: +(stats.mean / 1000 / 60).toFixed(2),
      std_dev_minutes: +(stats.std / 1000 / 60).toFixed(2),
      percentile_95_minutes: +(percentile95 / 1000 / 60).toFixed(2),
      percentile_99_minutes: +(percentile99 / 1000 / 60).toFixed(2)
    }
  };
  await fse.writeJson(path.join(OUT_DIR, "filtering_config.json"), filteringConfig, { spaces: 2 });

  console.log(`\n✅ Done! Enhanced files in ${OUT_DIR}/:
  - summary.json (${summary.total_hours} hours, ${summary.total_plays} plays across ${summary.years.length} years)
  - listening_by_year.json
  - listening_by_month.json
  - listening_by_hour.json
  - listening_by_day_of_week.json
  - top_artists_by_year.json
  - top_tracks_by_year.json
  - top_artists_all_time.json
  - top_tracks_all_time.json
  - top_albums.json
  - genre_breakdown.json
  - device_usage.json
  - binge_sessions.json
  - filtering_config.json
  - listening_daily.csv (${dailyRows.length - 1} days of data)
  
📊 Enhanced Data Summary:
  - Total Hours: ${summary.total_hours.toLocaleString()}
  - Total Plays: ${summary.total_plays.toLocaleString()}
  - Years: ${summary.years.join(', ')}
  - Date Range: ${summary.date_range.earliest} to ${summary.date_range.latest}
  - Data Sources: ${summary.data_sources} files processed
  - Unique Artists: ${summary.unique_artists.toLocaleString()}
  - Unique Tracks: ${summary.unique_tracks.toLocaleString()}
  - Unique Albums: ${summary.unique_albums.toLocaleString()}
  - Listening Sessions: ${summary.listening_sessions.toLocaleString()}
  - Longest Session: ${summary.longest_session_hours} hours

🔍 Filtering Results:
  - Original Items: ${summary.filtering_stats.original_items.toLocaleString()}
  - Filtered Items: ${summary.filtering_stats.filtered_items.toLocaleString()}
  - Excluded Items: ${summary.filtering_stats.excluded_items.toLocaleString()}
  - Manual Exclusions: ${exclusionStats.manual_artist_exclusion + exclusionStats.manual_track_exclusion + exclusionStats.manual_keyword_exclusion}
  - Unknown Metadata: ${exclusionStats.unknown_metadata}
  - Outliers (Z-score): ${exclusionStats.outlier_zscore}
  - Outliers (Percentile): ${exclusionStats.outlier_percentile}
  `);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
