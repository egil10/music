// scripts/build-spotify-simple.js
import fs from "fs";
import fse from "fs-extra";
import path from "path";
import dayjs from "dayjs";

const RAW = "raw/merged_spotify_data.json";
const OUT_DIR = "public/data";

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
  let totalMs = 0, totalPlays = 0;

  console.log("Aggregating data...");

  streamingHistory.forEach((item, index) => {
    if (index % 10000 === 0) {
      console.log(`Processed ${index} items...`);
    }

    // Common field names across exports
    const endTime = pick(item, ["endTime", "ts", "eventTime", "time"], null);
    const artist =
      pick(item, ["artistName", "master_metadata_artist_name", "artist"], "Unknown Artist");
    const track =
      pick(item, ["trackName", "master_metadata_track_name", "track"], "Unknown Track");
    const ms = Number(
      pick(item, ["msPlayed", "ms_played", "ms_played_sum", "durationMs", "duration_ms"], 0)
    ) || 0;

    const year = endTime ? toYear(endTime) : "unknown";
    const day = endTime ? toDate(endTime) : null;

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
  });

  console.log("Writing outputs…");

  // 1) Summary
  const summary = {
    total_ms: totalMs,
    total_hours: +(totalMs / 1000 / 3600).toFixed(2),
    total_plays: totalPlays,
    years: Object.keys(byYear).sort(),
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

  console.log(`Done. Files in ${OUT_DIR}/:
  - summary.json
  - listening_by_year.json
  - top_artists_by_year.json
  - top_tracks_by_year.json
  - listening_daily.csv
  `);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
