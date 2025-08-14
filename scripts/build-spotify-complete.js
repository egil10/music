// scripts/build-spotify-complete.js
import fs from "fs";
import fse from "fs-extra";
import path from "path";
import dayjs from "dayjs";

const OUT_DIR = "docs/data";

// Manual exclusion list - tracks/artists to always filter out
const MANUAL_EXCLUSIONS = {
  artists: ["Pilt!", "Unknown Artist", "unknown artist", "Unknown"],
  tracks: ["mary plays the piano", "unknown track", "Unknown Track"],
  keywords: ["test", "demo", "sample", "unknown"]
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
    if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
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

// Improved artist/track name extraction
function extractArtistName(item) {
  const artist = pick(item, [
    "artistName", 
    "master_metadata_artist_name", 
    "artist",
    "artist_name"
  ], "");
  
  // Clean up the artist name
  let cleanArtist = artist.trim();
  
  // Remove common prefixes/suffixes that indicate unknown data
  cleanArtist = cleanArtist.replace(/^(unknown|Unknown|UNKNOWN)\s*/i, "");
  cleanArtist = cleanArtist.replace(/\s*(unknown|Unknown|UNKNOWN)$/i, "");
  
  // If it's still empty or just whitespace, return null
  if (!cleanArtist || cleanArtist.trim() === "") {
    return null;
  }
  
  return cleanArtist;
}

function extractTrackName(item) {
  const track = pick(item, [
    "trackName", 
    "master_metadata_track_name", 
    "track",
    "track_name"
  ], "");
  
  // Clean up the track name
  let cleanTrack = track.trim();
  
  // Remove common prefixes/suffixes that indicate unknown data
  cleanTrack = cleanTrack.replace(/^(unknown|Unknown|UNKNOWN)\s*/i, "");
  cleanTrack = cleanTrack.replace(/\s*(unknown|Unknown|UNKNOWN)$/i, "");
  
  // If it's still empty or just whitespace, return null
  if (!cleanTrack || cleanTrack.trim() === "") {
    return null;
  }
  
  return cleanTrack;
}

function extractAlbumName(item) {
  const album = pick(item, [
    "albumName",
    "master_metadata_album_album_name",
    "album",
    "album_name"
  ], "");
  
  return album.trim() || null;
}

// Determine if this is music or podcast
function isPodcast(item) {
  const episodeName = pick(item, ["episodeName", "episode_name"], "");
  const showName = pick(item, ["showName", "show_name"], "");
  const episodeUri = pick(item, ["episodeUri", "episode_uri"], "");
  const showUri = pick(item, ["showUri", "show_uri"], "");
  
  // Check if any podcast-specific fields are present
  if (episodeName || showName || episodeUri || showUri) {
    return true;
  }
  
  // Check if the URI indicates podcast
  const uri = pick(item, ["spotify_track_uri", "track_uri", "uri"], "");
  if (uri && uri.includes("episode")) {
    return true;
  }
  
  return false;
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

// Improved filtering functions
function shouldExcludeTrack(item) {
  const artist = extractArtistName(item);
  const track = extractTrackName(item);
  const ms = Number(pick(item, ["msPlayed", "ms_played", "ms_played_sum", "durationMs", "duration_ms"], 0)) || 0;
  
  // If we can't extract valid artist or track names, exclude
  if (!artist || !track) {
    return { excluded: true, reason: "invalid_metadata" };
  }
  
  const artistLower = artist.toLowerCase();
  const trackLower = track.toLowerCase();
  
  // Manual exclusions
  if (MANUAL_EXCLUSIONS.artists.some(ex => artistLower.includes(ex.toLowerCase()))) {
    return { excluded: true, reason: "manual_artist_exclusion" };
  }
  
  if (MANUAL_EXCLUSIONS.tracks.some(ex => trackLower.includes(ex.toLowerCase()))) {
    return { excluded: true, reason: "manual_track_exclusion" };
  }
  
  if (MANUAL_EXCLUSIONS.keywords.some(keyword => 
    artistLower.includes(keyword.toLowerCase()) || trackLower.includes(keyword.toLowerCase())
  )) {
    return { excluded: true, reason: "manual_keyword_exclusion" };
  }
  
  // Unknown track/artist exclusions (more comprehensive)
  if (artistLower.includes("unknown") || trackLower.includes("unknown") ||
      artistLower === "unknown" || trackLower === "unknown" ||
      artistLower === "unknown artist" || trackLower === "unknown track") {
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
      if (file.includes('StreamingHistory_music') || file.includes('StreamingHistory_podcast')) {
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

  // Separate music and podcast data
  const musicData = [];
  const podcastData = [];
  
  allStreamingHistory.forEach(item => {
    if (isPodcast(item)) {
      podcastData.push(item);
    } else {
      musicData.push(item);
    }
  });
  
  console.log(`Music items: ${musicData.length}`);
  console.log(`Podcast items: ${podcastData.length}`);

  // Remove duplicates from music data (same track, artist, and timestamp)
  const uniqueMusicItems = new Map();
  musicData.forEach(item => {
    const artist = extractArtistName(item);
    const track = extractTrackName(item);
    const timestamp = pick(item, ["endTime", "ts", "eventTime", "time"]);
    
    if (artist && track && timestamp) {
      const key = `${artist}::${track}::${timestamp}`;
      if (!uniqueMusicItems.has(key)) {
        uniqueMusicItems.set(key, item);
      }
    }
  });
  
  const musicHistory = Array.from(uniqueMusicItems.values());
  console.log(`After removing duplicates: ${musicHistory.length} music items`);

  // Sort by date for proper timeline analysis
  musicHistory.sort((a, b) => {
    const dateA = pick(a, ["endTime", "ts", "eventTime", "time"]);
    const dateB = pick(b, ["endTime", "ts", "eventTime", "time"]);
    return new Date(dateA) - new Date(dateB);
  });

  // Pre-filtering and outlier detection
  console.log("\n🔍 Performing outlier detection and filtering...");

  const playTimes = musicHistory.map(item =>
    Number(pick(item, ["msPlayed", "ms_played", "ms_played_sum", "durationMs", "duration_ms"], 0)) || 0
  ).filter(ms => ms > 0);

  const stats = calculateStats(playTimes);
  const percentile95 = playTimes.sort((a, b) => a - b)[Math.floor(playTimes.length * 0.95)];
  const percentile99 = playTimes.sort((a, b) => a - b)[Math.floor(playTimes.length * 0.99)];

  // Filter items and collect exclusion statistics
  const filteredHistory = [];
  const exclusionStats = {
    manual_artist_exclusion: 0,
    manual_track_exclusion: 0,
    manual_keyword_exclusion: 0,
    unknown_metadata: 0,
    invalid_metadata: 0,
    too_short: 0,
    too_long: 0,
    outlier_zscore: 0,
    outlier_percentile: 0
  };

  musicHistory.forEach(item => {
    const ms = Number(pick(item, ["msPlayed", "ms_played", "ms_played_sum", "durationMs", "duration_ms"], 0)) || 0;

    const exclusion = shouldExcludeTrack(item);
    if (exclusion.excluded) {
      exclusionStats[exclusion.reason]++;
      return;
    }

    if (isOutlier(ms, stats.mean, stats.std)) {
      exclusionStats.outlier_zscore++;
      return;
    }

    if (ms > percentile99) {
      exclusionStats.outlier_percentile++;
      return;
    }

    const cappedMs = Math.min(ms, percentile99);
    const normalizedItem = { ...item };
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
  console.log(`  Original items: ${musicHistory.length}`);
  console.log(`  Filtered items: ${filteredHistory.length}`);
  console.log(`  Excluded items: ${musicHistory.length - filteredHistory.length}`);
  console.log(`  Exclusion breakdown:`);
  Object.entries(exclusionStats).forEach(([reason, count]) => {
    if (count > 0) {
      console.log(`    ${reason}: ${count}`);
    }
  });

  console.log("\nAggregating data with enhanced features...");

  // Initialize aggregation objects
  const byYear = {};
  const byMonth = [];
  const byHour = [];
  const byDayOfWeek = [];
  const byArtist = new Map();
  const byTrack = new Map();
  const byAlbum = new Map();
  const byGenre = new Map();
  const byDevice = new Map();
  const listeningSessions = [];
  
  let totalMs = 0, totalPlays = 0;
  let currentSession = null;
  const sessionThreshold = 30 * 60 * 1000; // 30 minutes

  // Process each item
  filteredHistory.forEach((item, index) => {
    const artist = extractArtistName(item);
    const track = extractTrackName(item);
    const album = extractAlbumName(item);
    const ms = Number(pick(item, ["msPlayed", "ms_played", "ms_played_sum", "durationMs", "duration_ms"], 0)) || 0;
    const endTime = pick(item, ["endTime", "ts", "eventTime", "time"]);
    const device = pick(item, ["platform", "device", "conn_country"], "Unknown");
    const uri = pick(item, ["spotify_track_uri", "track_uri", "uri"], "");

    if (!artist || !track || !endTime || ms === 0) return;

    totalMs += ms;
    totalPlays += 1;

    const year = toYear(endTime);
    const month = toMonth(endTime);
    const hour = toHour(endTime);
    const dayOfWeek = toDayOfWeek(endTime);
    const date = toDate(endTime);

    // Year aggregation
    if (!byYear[year]) byYear[year] = { ms: 0, plays: 0 };
    byYear[year].ms += ms;
    byYear[year].plays += 1;

    // Month aggregation
    if (month) {
      const monthEntry = byMonth.find(m => m.month === month);
      if (monthEntry) {
        monthEntry.ms += ms;
        monthEntry.plays += 1;
      } else {
        byMonth.push({ month, ms, plays: 1 });
      }
    }

    // Hour aggregation
    if (hour !== null) {
      const hourEntry = byHour.find(h => h.hour === hour);
      if (hourEntry) {
        hourEntry.ms += ms;
        hourEntry.plays += 1;
      } else {
        byHour.push({ hour, ms, plays: 1 });
      }
    }

    // Day of week aggregation
    if (dayOfWeek !== null) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayEntry = byDayOfWeek.find(d => d.day === dayOfWeek);
      if (dayEntry) {
        dayEntry.ms += ms;
        dayEntry.plays += 1;
      } else {
        byDayOfWeek.push({ day: dayOfWeek, dayName: dayNames[dayOfWeek], ms, plays: 1 });
      }
    }

    // Artist aggregation
    const artistEntry = byArtist.get(artist) || { artist, ms: 0, plays: 0 };
    artistEntry.ms += ms;
    artistEntry.plays += 1;
    byArtist.set(artist, artistEntry);

    // Track aggregation
    const trackKey = `${artist}::${track}`;
    const trackEntry = byTrack.get(trackKey) || { artist, track, ms: 0, plays: 0 };
    trackEntry.ms += ms;
    trackEntry.plays += 1;
    byTrack.set(trackKey, trackEntry);

    // Album aggregation
    if (album) {
      const albumKey = `${artist}::${album}`;
      const albumEntry = byAlbum.get(albumKey) || { artist, album, ms: 0, plays: 0 };
      albumEntry.ms += ms;
      albumEntry.plays += 1;
      byAlbum.set(albumKey, albumEntry);
    }

    // Device aggregation
    const deviceEntry = byDevice.get(device) || { device, ms: 0, plays: 0 };
    deviceEntry.ms += ms;
    deviceEntry.plays += 1;
    byDevice.set(device, deviceEntry);

    // Listening session detection
    if (currentSession) {
      const timeDiff = new Date(endTime) - new Date(currentSession.lastTime);
      if (timeDiff <= sessionThreshold) {
        currentSession.totalMs += ms;
        currentSession.trackCount += 1;
        currentSession.lastTime = endTime;
      } else {
        // End current session
        listeningSessions.push(currentSession);
        currentSession = {
          startTime: endTime,
          lastTime: endTime,
          totalMs: ms,
          trackCount: 1
        };
      }
    } else {
      currentSession = {
        startTime: endTime,
        lastTime: endTime,
        totalMs: ms,
        trackCount: 1
      };
    }
  });

  // Add the last session
  if (currentSession) {
    listeningSessions.push(currentSession);
  }

  // Convert hours and sort
  byMonth.forEach(m => m.hours = +(m.ms / 1000 / 3600).toFixed(2));
  byMonth.sort((a, b) => a.month.localeCompare(b.month));

  byHour.forEach(h => h.hours = +(h.ms / 1000 / 3600).toFixed(2));
  byHour.sort((a, b) => a.hour - b.hour);

  byDayOfWeek.forEach(d => d.hours = +(d.ms / 1000 / 3600).toFixed(2));
  byDayOfWeek.sort((a, b) => a.day - b.day);

  // Convert to arrays and sort
  const topArtistsAllTime = Array.from(byArtist.values())
    .map(a => ({ ...a, hours: +(a.ms / 1000 / 3600).toFixed(2) }))
    .sort((a, b) => b.hours - a.hours);

  const topTracksAllTime = Array.from(byTrack.values())
    .map(t => ({ ...t, hours: +(t.ms / 1000 / 3600).toFixed(2) }))
    .sort((a, b) => b.hours - a.hours);

  const topAlbums = Array.from(byAlbum.values())
    .map(a => ({ ...a, hours: +(a.ms / 1000 / 3600).toFixed(2) }))
    .sort((a, b) => b.hours - a.hours);

  const deviceUsage = Array.from(byDevice.values())
    .map(d => ({ ...d, hours: +(d.ms / 1000 / 3600).toFixed(2) }))
    .sort((a, b) => b.hours - a.hours);

  // Process binge sessions
  const bingeSessions = listeningSessions
    .map(session => ({
      ...session,
      totalHours: +(session.totalMs / 1000 / 3600).toFixed(2),
      duration: new Date(session.lastTime) - new Date(session.startTime)
    }))
    .sort((a, b) => b.totalHours - a.totalHours);

  console.log("\nWriting enhanced outputs...");

  // 1) Enhanced Summary with filtering stats
  const summary = {
    total_ms: totalMs,
    total_hours: +(totalMs / 1000 / 3600).toFixed(2),
    total_plays: totalPlays,
    years: Object.keys(byYear).sort(),
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
      original_items: musicHistory.length,
      filtered_items: filteredHistory.length,
      excluded_items: musicHistory.length - filteredHistory.length,
      exclusion_breakdown: exclusionStats
    },
    outlier_detection: {
      mean_play_time_minutes: +(stats.mean / 1000 / 60).toFixed(2),
      std_dev_minutes: +(stats.std / 1000 / 60).toFixed(2),
      percentile_95_minutes: +(percentile95 / 1000 / 60).toFixed(2),
      percentile_99_minutes: +(percentile99 / 1000 / 60).toFixed(2)
    },
    podcast_stats: {
      total_items: podcastData.length,
      unique_shows: new Set(podcastData.map(item => 
        pick(item, ["showName", "show_name"], "Unknown Show")
      )).size
    }
  };
  await fse.writeJson(path.join(OUT_DIR, "summary.json"), summary, { spaces: 2 });

  // 2) Per-year data
  const perYear = Object.fromEntries(
    Object.entries(byYear).sort(([a], [b]) => a.localeCompare(b)).map(([y, v]) => {
      const hours = +(v.ms / 1000 / 3600).toFixed(2);
      return [y, { ...v, hours }];
    })
  );
  await fse.writeJson(path.join(OUT_DIR, "listening_by_year.json"), perYear, { spaces: 2 });

  // 3) Monthly data
  await fse.writeJson(path.join(OUT_DIR, "listening_by_month.json"), byMonth, { spaces: 2 });

  // 4) Hourly data
  await fse.writeJson(path.join(OUT_DIR, "listening_by_hour.json"), byHour, { spaces: 2 });

  // 5) Day of week data
  await fse.writeJson(path.join(OUT_DIR, "listening_by_day_of_week.json"), byDayOfWeek, { spaces: 2 });

  // 6) Top artists all time
  await fse.writeJson(path.join(OUT_DIR, "top_artists_all_time.json"), topArtistsAllTime, { spaces: 2 });

  // 7) Top tracks all time
  await fse.writeJson(path.join(OUT_DIR, "top_tracks_all_time.json"), topTracksAllTime, { spaces: 2 });

  // 8) Top albums
  await fse.writeJson(path.join(OUT_DIR, "top_albums.json"), topAlbums, { spaces: 2 });

  // 9) Device usage
  await fse.writeJson(path.join(OUT_DIR, "device_usage.json"), deviceUsage, { spaces: 2 });

  // 10) Binge sessions
  await fse.writeJson(path.join(OUT_DIR, "binge_sessions.json"), bingeSessions, { spaces: 2 });

  // 11) Complete library data for table view
  const libraryData = topTracksAllTime.map(track => ({
    artist: track.artist,
    track: track.track,
    album: topAlbums.find(a => a.artist === track.artist)?.album || "Unknown Album",
    hours: track.hours,
    plays: track.plays,
    avg_play_time: +(track.ms / track.plays / 1000 / 60).toFixed(1)
  }));
  await fse.writeJson(path.join(OUT_DIR, "library_data.json"), libraryData, { spaces: 2 });

  // 12) Artist library data
  const artistLibraryData = topArtistsAllTime.map(artist => ({
    artist: artist.artist,
    hours: artist.hours,
    plays: artist.plays,
    tracks: topTracksAllTime.filter(t => t.artist === artist.artist).length,
    avg_play_time: +(artist.ms / artist.plays / 1000 / 60).toFixed(1)
  }));
  await fse.writeJson(path.join(OUT_DIR, "artist_library_data.json"), artistLibraryData, { spaces: 2 });

  // 13) Filtering configuration for UI
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

  // 14) Podcast data (separate from music)
  if (podcastData.length > 0) {
    const podcastSummary = {
      total_items: podcastData.length,
      unique_shows: new Set(podcastData.map(item => 
        pick(item, ["showName", "show_name"], "Unknown Show")
      )).size,
      total_hours: +(podcastData.reduce((sum, item) => 
        sum + (Number(pick(item, ["msPlayed", "ms_played", "ms_played_sum", "durationMs", "duration_ms"], 0)) || 0), 0
      ) / 1000 / 3600).toFixed(2)
    };
    await fse.writeJson(path.join(OUT_DIR, "podcast_summary.json"), podcastSummary, { spaces: 2 });
  }

  console.log(`\n✅ Done! Enhanced files in ${OUT_DIR}/:`);
  console.log(`  - summary.json (${summary.total_plays} plays, ${summary.total_hours}h)`);
  console.log(`  - listening_by_year.json (${Object.keys(byYear).length} years)`);
  console.log(`  - listening_by_month.json (${byMonth.length} months)`);
  console.log(`  - listening_by_hour.json (${byHour.length} hours)`);
  console.log(`  - listening_by_day_of_week.json (${byDayOfWeek.length} days)`);
  console.log(`  - top_artists_all_time.json (${topArtistsAllTime.length} artists)`);
  console.log(`  - top_tracks_all_time.json (${topTracksAllTime.length} tracks)`);
  console.log(`  - top_albums.json (${topAlbums.length} albums)`);
  console.log(`  - device_usage.json (${deviceUsage.length} devices)`);
  console.log(`  - binge_sessions.json (${bingeSessions.length} sessions)`);
  console.log(`  - library_data.json (${libraryData.length} tracks for table)`);
  console.log(`  - artist_library_data.json (${artistLibraryData.length} artists for table)`);
  console.log(`  - filtering_config.json (filtering settings)`);
  if (podcastData.length > 0) {
    console.log(`  - podcast_summary.json (${podcastData.length} podcast items)`);
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`  Total listening time: ${summary.total_hours} hours`);
  console.log(`  Total plays: ${summary.total_plays.toLocaleString()}`);
  console.log(`  Unique artists: ${summary.unique_artists.toLocaleString()}`);
  console.log(`  Unique tracks: ${summary.unique_tracks.toLocaleString()}`);
  console.log(`  Date range: ${summary.date_range.earliest} to ${summary.date_range.latest}`);
  console.log(`  Data retention: ${((summary.filtering_stats.filtered_items / summary.filtering_stats.original_items) * 100).toFixed(1)}%`);
}

main().catch(e => { console.error(e); process.exit(1); });
